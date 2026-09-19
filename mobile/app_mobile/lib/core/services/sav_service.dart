import 'package:dio/dio.dart';
import '../network/api_client.dart';

class SavService {
  SavService._();
  static final SavService instance = SavService._();

  final _api = ApiClient.instance;

  Future<List<Map<String, dynamic>>> mesTickets() async {
    try {
      final response = await _api.dio.get('/client/sav/tickets/');
      final list = (response.data['tickets'] as List?) ?? [];
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<Map<String, dynamic>> ticketDetail(int id) async {
    try {
      final response = await _api.dio.get('/client/sav/tickets/$id/');
      return Map<String, dynamic>.from(response.data as Map);
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<Map<String, dynamic>> creerTicket({
    required String sujet,
    required String description,
    String? numeroBillet,
    String priorite = 'MOYENNE',
  }) async {
    try {
      final response = await _api.dio.post(
        '/client/sav/tickets/',
        data: {
          'sujet': sujet,
          'description': description,
          'priorite': priorite,
          if (numeroBillet != null && numeroBillet.isNotEmpty)
            'numero_billet': numeroBillet,
        },
      );
      return Map<String, dynamic>.from(response.data as Map);
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }

  Future<Map<String, dynamic>> envoyerMessage({
    required int ticketId,
    required String contenu,
  }) async {
    try {
      final response = await _api.dio.post(
        '/client/sav/tickets/$ticketId/messages/',
        data: {'contenu': contenu},
      );
      return Map<String, dynamic>.from(response.data as Map);
    } on DioException catch (e) {
      throw ApiException(ApiClient.extractError(e), statusCode: e.response?.statusCode);
    }
  }
}
