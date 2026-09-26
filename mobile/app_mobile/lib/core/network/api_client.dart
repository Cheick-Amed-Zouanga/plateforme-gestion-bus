import 'dart:async';

import 'package:dio/dio.dart';
import '../storage/session_storage.dart';

/// Émulateur Android → 10.0.2.2 ; iOS sim / desktop → 127.0.0.1
const String kApiBaseUrl = 'http://10.0.2.2:8000/api';

/// Résout une URL média (logo, etc.) pour l'émulateur Android.
String? resolveMediaUrl(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  var url = raw;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    final origin = kApiBaseUrl.replaceFirst(RegExp(r'/api/?$'), '');
    url = url.startsWith('/') ? '$origin$url' : '$origin/$url';
  }
  return url
      .replaceFirst('http://127.0.0.1:', 'http://10.0.2.2:')
      .replaceFirst('http://localhost:', 'http://10.0.2.2:');
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  final Dio dio = Dio(
    BaseOptions(
      baseUrl: kApiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  bool _initialized = false;
  Completer<bool>? _refreshCompleter;

  Future<void> init() async {
    if (_initialized) return;
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SessionStorage.instance.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final status = error.response?.statusCode;
          final path = error.requestOptions.path;
          final isAuthCall = path.contains('/accounts/connexion/') ||
              path.contains('/accounts/token/refresh/') ||
              path.contains('/accounts/inscription/');

          if (status == 401 && !isAuthCall) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final opts = error.requestOptions;
              final token = await SessionStorage.instance.getAccessToken();
              opts.headers['Authorization'] = 'Bearer $token';
              try {
                final response = await dio.fetch(opts);
                return handler.resolve(response);
              } catch (_) {
                return handler.next(error);
              }
            }
          }
          handler.next(error);
        },
      ),
    );
    _initialized = true;
  }

  /// Un seul refresh à la fois (évite d'invalider le refresh rotatif).
  Future<bool> _tryRefresh() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }
    final completer = Completer<bool>();
    _refreshCompleter = completer;

    try {
      final refresh = await SessionStorage.instance.getRefreshToken();
      if (refresh == null || refresh.isEmpty) {
        completer.complete(false);
        return false;
      }

      final response = await Dio(
        BaseOptions(
          baseUrl: kApiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      ).post('/accounts/token/refresh/', data: {'refresh': refresh});

      final data = response.data as Map<String, dynamic>;
      final access = data['access'] as String?;
      final newRefresh = data['refresh'] as String?;
      if (access == null || access.isEmpty) {
        completer.complete(false);
        return false;
      }

      await SessionStorage.instance.saveTokens(
        access: access,
        refresh: newRefresh ?? refresh,
      );
      completer.complete(true);
      return true;
    } on DioException catch (e) {
      // Ne déconnecter que si le serveur refuse le refresh (token invalide).
      // Une panne réseau ne doit PAS effacer la session.
      final status = e.response?.statusCode;
      if (status == 401 || status == 400) {
        await SessionStorage.instance.clearAuth();
      }
      completer.complete(false);
      return false;
    } catch (_) {
      completer.complete(false);
      return false;
    } finally {
      _refreshCompleter = null;
    }
  }

  static String extractError(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      if (data['message'] != null) return data['message'].toString();
      if (data['detail'] != null) return data['detail'].toString();
      for (final value in data.values) {
        if (value is List && value.isNotEmpty) return value.first.toString();
        if (value is String && value.isNotEmpty) return value;
      }
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      return 'Impossible de joindre le serveur.';
    }
    return 'Une erreur est survenue.';
  }
}
