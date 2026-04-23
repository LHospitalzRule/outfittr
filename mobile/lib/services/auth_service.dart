// AuthService — login, register, logout, and JWT persistence for the Outfittr backend.

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';

// Wraps an auth API call result so callers can distinguish success from a user-facing error.
class AuthResult
{
  final bool success;
  final String? error;

  AuthResult.ok() : success = true, error = null;
  AuthResult.fail(this.error) : success = false;
}

class AuthService
{
  // SharedPreferences key where the active JWT is persisted across app launches.
  static const String _tokenKey = 'jwtToken';

  // Calls POST /api/login with JSON { login, password } and stores the returned token.
  // Backend returns HTTP 200 even for bad creds — domain errors live in body['error'].
  static Future<AuthResult> login(String email, String password) async
  {
    try
    {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'login': email, 'password': password}),
      );

      // 401 is returned for incorrect credentials; surface a friendly message.
      if (response.statusCode == 401)
      {
        return AuthResult.fail('Email or password is incorrect');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        return AuthResult.fail(err);
      }

      final token = (body['accessToken'] ?? '').toString();
      if (token.isEmpty)
      {
        return AuthResult.fail('Login failed: server returned no token');
      }

      await saveToken(token);
      return AuthResult.ok();
    }
    catch (e)
    {
      return AuthResult.fail('Network error: $e');
    }
  }

  // Calls POST /api/register. On success the backend also returns a token, but we
  // intentionally do NOT auto-login — the user is redirected to Login to sign in.
  static Future<AuthResult> register(String email, String password) async
  {
    try
    {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final err = (body['error'] ?? '').toString();
      if (err.isNotEmpty)
      {
        return AuthResult.fail(err);
      }

      return AuthResult.ok();
    }
    catch (e)
    {
      return AuthResult.fail('Network error: $e');
    }
  }

  // Persists the JWT so it survives an app restart and can be refreshed mid-session.
  static Future<void> saveToken(String token) async
  {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  // Returns the stored JWT, or null if the user has never logged in.
  static Future<String?> currentToken() async
  {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Decodes the stored JWT to pull out userId. Returns null if no token or decode fails.
  static Future<String?> currentUserId() async
  {
    final token = await currentToken();
    if (token == null || token.isEmpty) return null;
    try
    {
      final payload = JwtDecoder.decode(token);
      final userId = payload['userId'];
      return userId?.toString();
    }
    catch (_)
    {
      return null;
    }
  }

  // True when a non-expired token is stored. Used by the main.dart auth gate.
  static Future<bool> isLoggedIn() async
  {
    final token = await currentToken();
    if (token == null || token.isEmpty) return false;
    try
    {
      return !JwtDecoder.isExpired(token);
    }
    catch (_)
    {
      return false;
    }
  }

  // Calls POST /api/resend-verification with the given email. Returns a generic
  // success message from the backend even if the address isn't registered, so
  // the caller can always surface the message string without leaking account info.
  static Future<AuthResult> resendVerification(String email) async
  {
    try
    {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/resend-verification'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final body = jsonDecode(response.body) as Map<String, dynamic>;

      if (!response.statusCode.toString().startsWith('2'))
      {
        return AuthResult.fail((body['error'] ?? 'Unable to resend verification email').toString());
      }

      return AuthResult.ok();
    }
    catch (e)
    {
      return AuthResult.fail('Network error: $e');
    }
  }

  // Clears the stored token — used on logout or when the server reports an expired JWT.
  static Future<void> logout() async
  {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }
}
