import 'dart:convert';
import 'package:http/http.dart' as http;

// Pour émulateur Android : 10.0.2.2
// Pour iOS simulateur ou appareil physique sur le même réseau : IP de la machine
const String _baseUrl = 'http://10.0.2.2:8000/api';

class AuthException implements Exception {
  final String message;
  AuthException(this.message);

  @override
  String toString() => message;
}

Map<String, String> get _headers => {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

dynamic _parseResponse(http.Response response) {
  final data = jsonDecode(utf8.decode(response.bodyBytes));
  if (response.statusCode >= 200 && response.statusCode < 300) {
    return data;
  }
  if (data is Map) {
    final message = data['message'] ??
        data['detail'] ??
        (data.values.isNotEmpty ? data.values.first.toString() : null) ??
        'Une erreur est survenue.';
    throw AuthException(message.toString());
  }
  throw AuthException('Une erreur est survenue.');
}

Future<Map<String, dynamic>> login({
  required String username,
  required String password,
}) async {
  final response = await http.post(
    Uri.parse('$_baseUrl/accounts/connexion/'),
    headers: _headers,
    body: jsonEncode({'username': username, 'password': password}),
  );
  return _parseResponse(response) as Map<String, dynamic>;
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

  final response = await http.post(
    Uri.parse('$_baseUrl/accounts/inscription/client/'),
    headers: _headers,
    body: jsonEncode(body),
  );
  return _parseResponse(response) as Map<String, dynamic>;
}
