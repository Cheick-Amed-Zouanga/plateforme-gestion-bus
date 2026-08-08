import 'package:flutter/material.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/app_theme.dart';
import '../auth/login_page.dart';
import '../search/search_page.dart';
import '../settings/settings_page.dart';
import '../tickets/my_tickets_page.dart';
import 'home_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  bool _isGuest = true;
  String? _username;

  static const _menus = [
    (icon: Icons.home_rounded, label: 'Accueil'),
    (icon: Icons.search_rounded, label: 'Rechercher'),
    (icon: Icons.confirmation_number_rounded, label: 'Mes billets'),
    (icon: Icons.settings_rounded, label: 'Paramètres'),
  ];

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    final guest = await SessionStorage.instance.isGuest();
    final auth = await SessionStorage.instance.isAuthenticated();
    final username = await SessionStorage.instance.getUsername();
    if (!mounted) return;
    setState(() {
      _isGuest = guest || !auth;
      _username = username;
    });
  }

  void _select(int i) => setState(() => _index = i);

  Widget _body() {
    switch (_index) {
      case 1:
        return const SearchPage();
      case 2:
        return MyTicketsPage(isGuest: _isGuest, onNeedAuth: _askAuth);
      case 3:
        return SettingsPage(
          isGuest: _isGuest,
          username: _username,
          onChanged: _loadSession,
        );
      default:
        return HomePage(
          isGuest: _isGuest,
          onSearch: () => _select(1),
          onTickets: () => _select(2),
          onSettings: () => _select(3),
        );
    }
  }

  Future<void> _askAuth() async {
    await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage(popOnSuccess: true)),
    );
    if (!mounted) return;
    await _loadSession();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      appBar: AppBar(
        title: const Text('TERRASO'),
        automaticallyImplyLeading: false,
        actions: [
          if (_isGuest)
            TextButton(
              onPressed: () => Navigator.pushNamed(context, '/login'),
              child: const Text('Connexion', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: Padding(
              // Espace pour la nav flottante
              padding: EdgeInsets.only(bottom: 72 + bottomInset),
              child: _body(),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 12 + bottomInset,
            child: _FloatingBottomNav(
              menus: _menus,
              selected: _index,
              onSelect: _select,
            ),
          ),
        ],
      ),
    );
  }
}

class _FloatingBottomNav extends StatelessWidget {
  final List<({IconData icon, String label})> menus;
  final int selected;
  final ValueChanged<int> onSelect;

  const _FloatingBottomNav({
    required this.menus,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 16,
      shadowColor: AppColors.navy.withValues(alpha: 0.18),
      borderRadius: BorderRadius.circular(24),
      color: Colors.white,
      child: Container(
        height: 68,
        padding: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.borderGrey),
        ),
        child: Row(
          children: List.generate(menus.length, (i) {
            final m = menus[i];
            final active = selected == i;
            return Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () => onSelect(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
                  decoration: BoxDecoration(
                    color: active
                        ? AppColors.primaryBlue.withValues(alpha: 0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        m.icon,
                        size: 22,
                        color: active ? AppColors.primaryBlue : AppColors.textGrey,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        m.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                          color: active ? AppColors.primaryBlue : AppColors.textGrey,
                        ),
                      ),
                      if (active) ...[
                        const SizedBox(height: 2),
                        Container(
                          width: 5,
                          height: 5,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryBlue,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
