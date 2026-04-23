// ItemService — CRUD over /api/*item* endpoints.
// Auth pattern is split: searchitems/additem/edititem use Authorization: Bearer header
// (via the backend's resolveAuth helper); deleteitem uses the old jwtToken field pattern.

import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/item.dart';
import 'auth_service.dart';

// Generic wrapper carrying either a payload or an error string.
class ItemResult<T>
{
  final T? data;
  final String? error;

  ItemResult.ok(this.data) : error = null;
  ItemResult.fail(this.error) : data = null;

  bool get success => error == null;
}

class ItemService
{
  static const String _expiredJwtError = 'The JWT is no longer valid';

  // Fetches all items owned by the current user. Pass an empty string to get
  // everything; pass a query to filter by name/type/tags on the backend.
  static Future<ItemResult<List<Item>>> searchItems(String query) async
  {
    final token = await AuthService.currentToken();
    if (token == null) return ItemResult.fail('Not logged in');

    try
    {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/searchitems'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'search': query}),
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      _saveRefreshedToken(body);

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return ItemResult.fail(err);
      }

      // Backend returns the list under 'results' or 'items' depending on version.
      final rawList = body['results'] ?? body['items'];
      final items = rawList is List
          ? rawList
              .map((e) => Item.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList()
          : <Item>[];

      return ItemResult.ok(items);
    }
    catch (e)
    {
      return ItemResult.fail('Network error: $e');
    }
  }

  // Creates a new item. Pass imageBytes + imageName to attach a photo, or omit both.
  // Uses multipart/form-data so the image file can be attached.
  static Future<ItemResult<Item>> addItem({
    required String name,
    required String type,
    required String notes,
    required List<String> tags,
    Uint8List? imageBytes,
    String? imageName,
  }) async
  {
    final token = await AuthService.currentToken();
    if (token == null) return ItemResult.fail('Not logged in');

    try
    {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/additem'),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['name'] = name;
      request.fields['type'] = type;
      request.fields['notes'] = notes;
      // Backend expects a JSON array string: '["casual","summer"]'
      request.fields['tags'] = jsonEncode(tags);

      if (imageBytes != null && imageName != null)
      {
        request.files.add(
          http.MultipartFile.fromBytes('image', imageBytes, filename: imageName),
        );
      }

      final body = await _sendAndDecode(request);
      if (body == null) return ItemResult.fail('Network error');

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return ItemResult.fail(err);
      }

      final itemJson = body['item'];
      if (itemJson is Map)
      {
        return ItemResult.ok(Item.fromJson(Map<String, dynamic>.from(itemJson)));
      }

      return ItemResult.fail('Server returned no item data');
    }
    catch (e)
    {
      return ItemResult.fail('Network error: $e');
    }
  }

  // Edits an existing item. Pass imageBytes + imageName to replace the photo, or
  // omit both to keep the existing imageURL unchanged.
  static Future<ItemResult<Item>> editItem({
    required String itemId,
    required String name,
    required String type,
    required String notes,
    required List<String> tags,
    Uint8List? imageBytes,
    String? imageName,
  }) async
  {
    final token = await AuthService.currentToken();
    if (token == null) return ItemResult.fail('Not logged in');

    try
    {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/edititem'),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['itemId'] = itemId;
      request.fields['name'] = name;
      request.fields['type'] = type;
      request.fields['notes'] = notes;
      request.fields['tags'] = jsonEncode(tags);

      if (imageBytes != null && imageName != null)
      {
        request.files.add(
          http.MultipartFile.fromBytes('image', imageBytes, filename: imageName),
        );
      }

      final body = await _sendAndDecode(request);
      if (body == null) return ItemResult.fail('Network error');

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return ItemResult.fail(err);
      }

      final itemJson = body['item'];
      if (itemJson is Map)
      {
        return ItemResult.ok(Item.fromJson(Map<String, dynamic>.from(itemJson)));
      }

      return ItemResult.fail('Server returned no item data');
    }
    catch (e)
    {
      return ItemResult.fail('Network error: $e');
    }
  }

  // Deletes an item. Uses the old form-field auth pattern (userId + jwtToken in body)
  // because that's what the backend's deleteitem endpoint expects.
  static Future<ItemResult<void>> deleteItem(String itemId) async
  {
    final userId = await AuthService.currentUserId();
    final token = await AuthService.currentToken();
    if (userId == null || token == null) return ItemResult.fail('Not logged in');

    try
    {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/deleteitem'),
      );
      request.fields['userId'] = userId;
      request.fields['itemId'] = itemId;
      request.fields['jwtToken'] = token;

      final body = await _sendAndDecode(request);
      if (body == null) return ItemResult.fail('Network error');

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return ItemResult.fail(err);
      }

      return ItemResult.ok(null);
    }
    catch (e)
    {
      return ItemResult.fail('Network error: $e');
    }
  }

  // Sends a MultipartRequest, decodes the JSON body, and persists any refreshed token.
  static Future<Map<String, dynamic>?> _sendAndDecode(http.MultipartRequest request) async
  {
    final streamed = await request.send();
    final responseBody = await streamed.stream.bytesToString();

    Map<String, dynamic> decoded;
    try
    {
      decoded = jsonDecode(responseBody) as Map<String, dynamic>;
    }
    catch (_)
    {
      return null;
    }

    _saveRefreshedToken(decoded);
    return decoded;
  }

  static void _saveRefreshedToken(Map<String, dynamic> body) async
  {
    final refreshed = (body['accessToken'] ?? '').toString();
    if (refreshed.isNotEmpty) await AuthService.saveToken(refreshed);
  }
}
