// OutfitService — CRUD over /api/*outfit* endpoints. All calls are multipart/form-data
// because the backend's upload.none() / upload.single() middleware expects FormData.

import 'dart:convert';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/outfit.dart';
import 'auth_service.dart';

// Generic wrapper carrying either a payload or an error string.
class OutfitResult<T>
{
  final T? data;
  final String? error;

  OutfitResult.ok(this.data) : error = null;
  OutfitResult.fail(this.error) : data = null;

  bool get success => error == null;
}

class OutfitService
{
  // Sent by the backend when the JWT has expired — treat as a forced logout.
  static const String _expiredJwtError = 'The JWT is no longer valid';

  // Lists all outfits owned by the current user.
  // Uses /api/searchoutfits with an empty search string, which regex-matches every name.
  static Future<OutfitResult<List<Outfit>>> listOutfits() async
  {
    final userId = await AuthService.currentUserId();
    final token = await AuthService.currentToken();
    if (userId == null || token == null) return OutfitResult.fail('Not logged in');

    try
    {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/searchoutfits'),
      );
      request.fields['userId'] = userId;
      request.fields['search'] = '';
      request.fields['jwtToken'] = token;

      final body = await _sendAndDecode(request);
      if (body == null) return OutfitResult.fail('Network error');

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return OutfitResult.fail(err);
      }

      final rawList = body['results'];
      final outfits = rawList is List
          ? rawList
              .map((o) => Outfit.fromJson(Map<String, dynamic>.from(o as Map)))
              .toList()
          : <Outfit>[];

      return OutfitResult.ok(outfits);
    }
    catch (e)
    {
      return OutfitResult.fail('Network error: $e');
    }
  }

  // Creates a new outfit. itemIds is serialized as a JSON array string so the backend
  // parses it via parseItemIds without ambiguity.
  static Future<OutfitResult<Outfit>> addOutfit(
      {required String name, required String description, required List<String> itemIds}) async
  {
    final userId = await AuthService.currentUserId();
    final token = await AuthService.currentToken();
    if (userId == null || token == null) return OutfitResult.fail('Not logged in');

    try
    {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/addoutfit'),
      );
      request.fields['userId'] = userId;
      request.fields['name'] = name;
      request.fields['description'] = description;
      request.fields['itemIds'] = jsonEncode(itemIds);
      request.fields['jwtToken'] = token;

      final body = await _sendAndDecode(request);
      if (body == null) return OutfitResult.fail('Network error');

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return OutfitResult.fail(err);
      }

      final outfitJson = body['outfit'];
      if (outfitJson is! Map) return OutfitResult.fail('Server returned no outfit');

      return OutfitResult.ok(Outfit.fromJson(Map<String, dynamic>.from(outfitJson)));
    }
    catch (e)
    {
      return OutfitResult.fail('Network error: $e');
    }
  }

  // Edits an existing outfit. All fields are required by the backend.
  static Future<OutfitResult<Outfit>> editOutfit({
    required String outfitId,
    required String name,
    required String description,
    required List<String> itemIds,
  }) async
  {
    final userId = await AuthService.currentUserId();
    final token = await AuthService.currentToken();
    if (userId == null || token == null) return OutfitResult.fail('Not logged in');

    try
    {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/editoutfit'),
      );
      request.fields['userId'] = userId;
      request.fields['outfitId'] = outfitId;
      request.fields['name'] = name;
      request.fields['description'] = description;
      request.fields['itemIds'] = jsonEncode(itemIds);
      request.fields['jwtToken'] = token;

      final body = await _sendAndDecode(request);
      if (body == null) return OutfitResult.fail('Network error');

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return OutfitResult.fail(err);
      }

      final outfitJson = body['outfit'];
      if (outfitJson is! Map) return OutfitResult.fail('Server returned no outfit');

      return OutfitResult.ok(Outfit.fromJson(Map<String, dynamic>.from(outfitJson)));
    }
    catch (e)
    {
      return OutfitResult.fail('Network error: $e');
    }
  }

  // Deletes an outfit by id. Returns success with no payload.
  static Future<OutfitResult<void>> deleteOutfit(String outfitId) async
  {
    final userId = await AuthService.currentUserId();
    final token = await AuthService.currentToken();
    if (userId == null || token == null) return OutfitResult.fail('Not logged in');

    try
    {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiConfig.baseUrl}/api/deleteoutfit'),
      );
      request.fields['userId'] = userId;
      request.fields['outfitId'] = outfitId;
      request.fields['jwtToken'] = token;

      final body = await _sendAndDecode(request);
      if (body == null) return OutfitResult.fail('Network error');

      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        if (err == _expiredJwtError) await AuthService.logout();
        return OutfitResult.fail(err);
      }

      return OutfitResult.ok(null);
    }
    catch (e)
    {
      return OutfitResult.fail('Network error: $e');
    }
  }

  // Sends a MultipartRequest, decodes the JSON body, and opportunistically persists
  // any refreshed accessToken returned by the backend so the session stays alive.
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

    // Every authenticated endpoint returns a refreshed accessToken — save it if present.
    final refreshed = (decoded['accessToken'] ?? '').toString();
    if (refreshed.isNotEmpty)
    {
      await AuthService.saveToken(refreshed);
    }

    return decoded;
  }
}
