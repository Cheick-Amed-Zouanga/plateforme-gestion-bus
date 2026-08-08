import 'package:dio/dio.dart';
import '../network/api_client.dart';

class ClientService {
  ClientService._();
  static final ClientService instance = ClientService._();

  final _api = ApiClient.instance;

  Future<List<String>> fetchVilles() async {
    try {
      final response = await _api.dio.get('/client/villes/');
      final list = (response.data['villes'] as List?) ?? [];
      return list.map((e) => e.toString()).toList();
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<List<Map<String, dynamic>>> searchTrajets({
    required String depart,
    required String arrivee,
    String? date,
  }) async {
    try {
      final response = await _api.dio.get(
        '/client/trajets/',
        queryParameters: {
          'depart': depart,
          'arrivee': arrivee,
          if (date != null && date.isNotEmpty) 'date': date,
        },
      );
      final list = (response.data['trajets'] as List?) ?? [];
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<Map<String, dynamic>> trajetDetail(
    int id, {
    String? depart,
    String? arrivee,
  }) async {
    try {
      final response = await _api.dio.get(
        '/client/trajets/$id/',
        queryParameters: {
          if (depart != null) 'depart': depart,
          if (arrivee != null) 'arrivee': arrivee,
        },
      );
      return Map<String, dynamic>.from(response.data as Map);
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<Map<String, dynamic>> planBus({
    required int trajetId,
    required int arretDepart,
    required int arretArrivee,
  }) async {
    try {
      final response = await _api.dio.get(
        '/client/trajets/$trajetId/plan/',
        queryParameters: {
          'arret_depart': arretDepart,
          'arret_arrivee': arretArrivee,
        },
      );
      return Map<String, dynamic>.from(response.data as Map);
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<Map<String, dynamic>> commander({
    required int trajet,
    required int siege,
    required int arretDepart,
    required int arretArrivee,
    required String modePaiement,
  }) async {
    try {
      final response = await _api.dio.post(
        '/client/commander/',
        data: {
          'trajet': trajet,
          'siege': siege,
          'arret_depart': arretDepart,
          'arret_arrivee': arretArrivee,
          'mode_paiement': modePaiement,
        },
      );
      return Map<String, dynamic>.from(response.data as Map);
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<List<Map<String, dynamic>>> mesBillets() async {
    try {
      final response = await _api.dio.get('/client/mes-billets/');
      final list = (response.data['billets'] as List?) ?? [];
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<Map<String, dynamic>> billetDetail(String numero) async {
    try {
      final response = await _api.dio.get('/client/mes-billets/$numero/');
      return Map<String, dynamic>.from(response.data as Map);
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }
}
