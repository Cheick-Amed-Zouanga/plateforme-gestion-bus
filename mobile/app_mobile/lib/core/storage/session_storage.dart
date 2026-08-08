import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SessionStorage {
  SessionStorage._();
  static final SessionStorage instance = SessionStorage._();

  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  static const _usernameKey = 'username';
  static const _onboardingKey = 'onboarding_done';
  static const _guestKey = 'is_guest';

  final FlutterSecureStorage _secure = const FlutterSecureStorage();

  Future<bool> isOnboardingDone() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  Future<void> setOnboardingDone() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, true);
  }

  Future<bool> isGuest() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_guestKey) ?? false;
  }

  Future<void> setGuest(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_guestKey, value);
  }

  Future<void> saveTokens({
    required String access,
    required String refresh,
    String? username,
  }) async {
    await _secure.write(key: _accessKey, value: access);
    await _secure.write(key: _refreshKey, value: refresh);
    if (username != null) {
      await _secure.write(key: _usernameKey, value: username);
    }
    await setGuest(false);
  }

  Future<String?> getAccessToken() => _secure.read(key: _accessKey);
  Future<String?> getRefreshToken() => _secure.read(key: _refreshKey);
  Future<String?> getUsername() => _secure.read(key: _usernameKey);

  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> clearAuth() async {
    await _secure.delete(key: _accessKey);
    await _secure.delete(key: _refreshKey);
    await _secure.delete(key: _usernameKey);
  }

  Future<void> clearAll() async {
    await clearAuth();
    await setGuest(false);
  }
}
