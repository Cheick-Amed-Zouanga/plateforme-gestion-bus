import 'package:dio/dio.dart';
import '../network/api_client.dart';
import '../storage/session_storage.dart';

class AuthException implements Exception {
  final String message;
  AuthException(this.message);

  @override
  String toString() => message;
}

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  final _api = ApiClient.instance;
  final _session = SessionStorage.instance;

  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _api.dio.post(
        '/accounts/connexion/',
        data: {'username': username, 'password': password},
      );
      final data = Map<String, dynamic>.from(response.data as Map);
      final access = data['access'] as String?;
      final refresh = data['refresh'] as String?;
      if (access == null || refresh == null) {
        throw AuthException('Réponse de connexion invalide.');
      }
      await _session.saveTokens(
        access: access,
        refresh: refresh,
        username: data['username'] as String? ?? username,
      );
      return data;
    } on DioException catch (e) {
      throw AuthException(ApiClient.extractError(e));
    }
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String telephone,
    required String dateNaissance,
    String? contactNom,
    String? contactTelephone,
    String? contactRelation,
  }) async {
    final body = <String, dynamic>{
      'username': username,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'password': password,
      'telephone': telephone,
      'date_naissance': dateNaissance,
    };
    if (contactNom != null && contactNom.isNotEmpty) {
      body['contact_nom'] = contactNom;
    }
    if (contactTelephone != null && contactTelephone.isNotEmpty) {
      body['contact_telephone'] = contactTelephone;
    }
    if (contactRelation != null && contactRelation.isNotEmpty) {
      body['contact_relation'] = contactRelation;
    }

    try {
      await _api.dio.post('/accounts/inscription/client/', data: body);
      return login(username: username, password: password);
    } on DioException catch (e) {
      throw AuthException(ApiClient.extractError(e));
    } on AuthException {
      rethrow;
    }
  }

  Future<void> logout() async {
    final refresh = await _session.getRefreshToken();
    try {
      await _api.dio.post('/accounts/deconnexion/', data: {
        if (refresh != null) 'refresh': refresh,
      });
    } catch (_) {
      // ignore network errors on logout
    }
    await _session.clearAll();
  }

  Future<void> continueAsGuest() async {
    await _session.clearAuth();
    await _session.setGuest(true);
  }
}

// Compatibilité avec les anciens imports directs
Future<Map<String, dynamic>> login({
  required String username,
  required String password,
}) =>
    AuthService.instance.login(username: username, password: password);

Future<Map<String, dynamic>> register({
  required String username,
  required String firstName,
  required String lastName,
  required String email,
  required String password,
  required String telephone,
  required String dateNaissance,
  String? contactNom,
  String? contactTelephone,
  String? contactRelation,
}) =>
    AuthService.instance.register(
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      telephone: telephone,
      dateNaissance: dateNaissance,
      contactNom: contactNom,
      contactTelephone: contactTelephone,
      contactRelation: contactRelation,
    );
