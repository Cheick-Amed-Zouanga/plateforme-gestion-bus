import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/network/api_client.dart';
import '../../core/services/sav_service.dart';
import '../../core/theme/app_theme.dart';

class SavTicketChatPage extends StatefulWidget {
  final int ticketId;

  const SavTicketChatPage({super.key, required this.ticketId});

  @override
  State<SavTicketChatPage> createState() => _SavTicketChatPageState();
}

class _SavTicketChatPageState extends State<SavTicketChatPage> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  Map<String, dynamic>? _ticket;
  bool _loading = true;
  bool _sending = false;
  String? _error;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _load(initial: true);
    _poll = Timer.periodic(const Duration(seconds: 2), (_) => _load());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _load({bool initial = false}) async {
    try {
      final data = await SavService.instance.ticketDetail(widget.ticketId);
      if (!mounted) return;
      final prevCount = ((_ticket?['messages'] as List?) ?? []).length;
      final nextCount = ((data['messages'] as List?) ?? []).length;
      setState(() {
        _ticket = data;
        _loading = false;
        _error = null;
      });
      if (nextCount > prevCount || initial) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollCtrl.hasClients) {
            _scrollCtrl.animateTo(
              _scrollCtrl.position.maxScrollExtent,
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOut,
            );
          }
        });
      }
    } on ApiException catch (e) {
      if (initial && mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    } catch (_) {
      if (initial && mounted) {
        setState(() {
          _error = 'Impossible de charger la conversation.';
          _loading = false;
        });
      }
    }
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await SavService.instance.envoyerMessage(
        ticketId: widget.ticketId,
        contenu: text,
      );
      _msgCtrl.clear();
      await _load();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  bool get _canWrite {
    final s = _ticket?['statut']?.toString();
    return s != 'FERME' && s != 'RESOLU';
  }

  @override
  Widget build(BuildContext context) {
    final sujet = _ticket?['sujet']?.toString() ?? 'Conversation SAV';
    final messages = ((_ticket?['messages'] as List?) ?? [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(sujet, style: const TextStyle(fontSize: 16)),
            if (_ticket != null)
              Text(
                'En direct · ${_ticket!['statut_display'] ?? _ticket!['statut']}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
              ),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.errorRed)))
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, i) {
                          final m = messages[i];
                          final isClient = m['auteur_client'] == true;
                          final when = m['cree_le'] != null
                              ? DateFormat('HH:mm').format(
                                  DateTime.parse(m['cree_le'].toString()).toLocal(),
                                )
                              : '';
                          return Align(
                            alignment: isClient ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.78,
                              ),
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isClient
                                    ? AppColors.primaryBlue
                                    : AppColors.tealSoft,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(16),
                                  topRight: const Radius.circular(16),
                                  bottomLeft: Radius.circular(isClient ? 16 : 4),
                                  bottomRight: Radius.circular(isClient ? 4 : 16),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isClient ? 'Vous' : 'SAV',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: isClient
                                          ? Colors.white70
                                          : AppColors.teal,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    m['contenu']?.toString() ?? '',
                                    style: TextStyle(
                                      color: isClient ? Colors.white : AppColors.navy,
                                      height: 1.35,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    when,
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: isClient
                                          ? Colors.white60
                                          : AppColors.textGrey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    if (_canWrite)
                      SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                          child: Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _msgCtrl,
                                  minLines: 1,
                                  maxLines: 4,
                                  textInputAction: TextInputAction.send,
                                  onSubmitted: (_) => _send(),
                                  decoration: InputDecoration(
                                    hintText: 'Écrire un message…',
                                    filled: true,
                                    fillColor: Colors.white,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(24),
                                      borderSide: const BorderSide(color: AppColors.borderGrey),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton.filled(
                                onPressed: _sending ? null : _send,
                                icon: _sending
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : const Icon(Icons.send_rounded),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        color: AppColors.background,
                        child: const Text(
                          'Ticket clos — créez un nouveau ticket si besoin.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textGrey),
                        ),
                      ),
                  ],
                ),
    );
  }
}
