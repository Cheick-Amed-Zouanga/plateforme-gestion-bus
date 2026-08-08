import 'package:dio/dio.dart';
import '../storage/session_storage.dart';

/// Émulateur Android → 10.0.2.2 ; iOS sim / desktop → 127.0.0.1
const String kApiBaseUrl = 'http://10.0.2.2:8000/api';

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
          if (error.response?.statusCode == 401) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final opts = error.requestOptions;
              final token = await SessionStorage.instance.getAccessToken();
              opts.headers['Authorization'] = 'Bearer $token';
              try {
                final response = await dio.fetch(opts);
                return handler.resolve(response);
              } catch (e) {
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

  Future<bool> _tryRefresh() async {
    final refresh = await SessionStorage.instance.getRefreshToken();
    if (refresh == null || refresh.isEmpty) return false;
    try {
      final response = await Dio(
        BaseOptions(baseUrl: kApiBaseUrl),
      ).post('/accounts/token/refresh/', data: {'refresh': refresh});
      final data = response.data as Map<String, dynamic>;
      final access = data['access'] as String?;
      final newRefresh = data['refresh'] as String?;
      if (access == null) return false;
      await SessionStorage.instance.saveTokens(
        access: access,
        refresh: newRefresh ?? refresh,
      );
      return true;
    } catch (_) {
      await SessionStorage.instance.clearAuth();
      return false;
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
