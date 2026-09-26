import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/services/sav_service.dart';
import '../../core/theme/app_theme.dart';
import 'sav_ticket_chat_page.dart';

class CreateSavTicketPage extends StatefulWidget {
  const CreateSavTicketPage({super.key});

  @override
  State<CreateSavTicketPage> createState() => _CreateSavTicketPageState();
}

class _CreateSavTicketPageState extends State<CreateSavTicketPage> {
  final _sujetCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _priorite = 'MOYENNE';
  String? _numeroBillet;
  List<Map<String, dynamic>> _billets = [];
  bool _loadingBillets = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBillets();
  }

  @override
  void dispose() {
    _sujetCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadBillets() async {
    try {
      final list = await ClientService.instance.mesBillets();
      if (!mounted) return;
      setState(() {
        _billets = list;
        _loadingBillets = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingBillets = false);
    }
  }

  Future<void> _submit() async {
    final sujet = _sujetCtrl.text.trim();
    final desc = _descCtrl.text.trim();
    if (sujet.isEmpty || desc.isEmpty) {
      setState(() => _error = 'Sujet et description obligatoires.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final ticket = await SavService.instance.creerTicket(
        sujet: sujet,
        description: desc,
        numeroBillet: _numeroBillet,
        priorite: _priorite,
      );
      if (!mounted) return;
      final id = ticket['id'] as int;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => SavTicketChatPage(ticketId: id)),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Échec de la création du ticket.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nouveau ticket SAV')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Décrivez votre problème. Un agent vous répondra en direct dans la conversation.',
            style: TextStyle(color: AppColors.textGrey, height: 1.4),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _sujetCtrl,
            decoration: const InputDecoration(
              labelText: 'Sujet',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _descCtrl,
            minLines: 4,
            maxLines: 8,
            decoration: const InputDecoration(
              labelText: 'Description',
              alignLabelWithHint: true,
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            value: _priorite,
            decoration: const InputDecoration(
              labelText: 'Priorité',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 'BASSE', child: Text('Basse')),
              DropdownMenuItem(value: 'MOYENNE', child: Text('Moyenne')),
              DropdownMenuItem(value: 'HAUTE', child: Text('Haute')),
            ],
            onChanged: (v) => setState(() => _priorite = v ?? 'MOYENNE'),
          ),
          const SizedBox(height: 14),
          if (_loadingBillets)
            const LinearProgressIndicator()
          else
            DropdownButtonFormField<String?>(
              value: _numeroBillet,
              decoration: const InputDecoration(
                labelText: 'Billet concerné (optionnel)',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<String?>(value: null, child: Text('Aucun')),
                ..._billets.map((b) {
                  final n = b['numero_billet']?.toString() ?? '';
                  return DropdownMenuItem<String?>(
                    value: n,
                    child: Text(n, overflow: TextOverflow.ellipsis),
                  );
                }),
              ],
              onChanged: (v) => setState(() => _numeroBillet = v),
            ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.errorRed)),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _submit,
            child: Text(_saving ? 'Envoi…' : 'Créer et ouvrir la conversation'),
          ),
        ],
      ),
    );
  }
}
