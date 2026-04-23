// API configuration — base URL for the Outfittr backend.

import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig
{
  // Returns the backend base URL for the current runtime target.
  // - Android emulator cannot reach the host via "localhost"; it must use 10.0.2.2.
  // - iOS simulator, macOS, Windows, Linux, and web can all use localhost directly.
  // - For a physical device, replace the value with the LAN IP of the machine running the server.
  static String get baseUrl
  {
    if (!kIsWeb && Platform.isAndroid)
    {
      return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000';
  }
}
