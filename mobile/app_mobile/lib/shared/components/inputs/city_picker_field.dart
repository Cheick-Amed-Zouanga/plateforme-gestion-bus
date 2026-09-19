import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class CityPickerField extends StatefulWidget {
  final String? value;
  final List<String> cities;
  final ValueChanged<String> onCitySelected;
  final String label;
  final String? hint;
  final String? Function(String?)? validator;
  /// Mode compact : moins de padding, idéal pour De / À côte à côte.
  final bool compact;
  final IconData? prefixIconData;

  const CityPickerField({
    super.key,
    this.value,
    required this.cities,
    required this.onCitySelected,
    required this.label,
    this.hint,
    this.validator,
    this.compact = false,
    this.prefixIconData,
  });

  @override
  State<CityPickerField> createState() => _CityPickerFieldState();
}

class _CityPickerFieldState extends State<CityPickerField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value ?? '');
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(CityPickerField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _controller.text = widget.value ?? '';
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }

  Future<void> _showCityPicker() async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CityPickerModal(
        cities: widget.cities,
        selectedCity: _controller.text,
      ),
    );

    if (mounted && selected != null) {
      setState(() {
        _controller.text = selected;
      });
      widget.onCitySelected(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _showCityPicker,
      child: TextFormField(
        onTap: _showCityPicker,
        controller: _controller,
        focusNode: _focusNode,
        readOnly: true,
        validator: widget.validator,
        style: TextStyle(
          fontSize: widget.compact ? 13 : 14,
          color: AppColors.textBody,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          isDense: widget.compact,
          labelStyle: TextStyle(
            color: _isFocused ? AppColors.primaryBlue : AppColors.textGrey,
            fontSize: widget.compact ? 12 : 14,
            fontWeight: FontWeight.w500,
          ),
          hintStyle: TextStyle(
            color: AppColors.textLight,
            fontSize: widget.compact ? 12 : 14,
          ),
          prefixIcon: Icon(
            widget.prefixIconData ?? Icons.location_on_rounded,
            size: widget.compact ? 18 : 20,
            color: AppColors.textGrey,
          ),
          suffixIcon: widget.compact
              ? null
              : Icon(
                  Icons.arrow_drop_down_rounded,
                  color: _isFocused ? AppColors.primaryBlue : AppColors.textGrey,
                  size: 24,
                ),
          filled: true,
          fillColor: AppColors.surface,
          contentPadding: EdgeInsets.symmetric(
            horizontal: widget.compact ? AppSpacing.sm : AppSpacing.lg,
            vertical: widget.compact ? AppSpacing.sm : AppSpacing.md,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              widget.compact ? AppSpacing.radiusMedium : AppSpacing.radiusLarge,
            ),
            borderSide: const BorderSide(
              color: AppColors.borderGrey,
              width: 1,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              widget.compact ? AppSpacing.radiusMedium : AppSpacing.radiusLarge,
            ),
            borderSide: const BorderSide(
              color: AppColors.borderGrey,
              width: 1,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              widget.compact ? AppSpacing.radiusMedium : AppSpacing.radiusLarge,
            ),
            borderSide: const BorderSide(
              color: AppColors.primaryBlue,
              width: 2,
            ),
          ),
        ),
      ),
    );
  }
}

class _CityPickerModal extends StatefulWidget {
  final List<String> cities;
  final String selectedCity;

  const _CityPickerModal({
    required this.cities,
    required this.selectedCity,
  });

  @override
  State<_CityPickerModal> createState() => _CityPickerModalState();
}

class _CityPickerModalState extends State<_CityPickerModal> {
  late List<String> _filteredCities;
  late TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _filteredCities = widget.cities;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterCities(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredCities = widget.cities;
      } else {
        _filteredCities = widget.cities
            .where((city) => city.toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.radiusRound),
          topRight: Radius.circular(AppSpacing.radiusRound),
        ),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.borderGrey),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Sélectionner une ville',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded),
                  color: AppColors.textGrey,
                ),
              ],
            ),
          ),

          // Search field
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: TextField(
              controller: _searchController,
              onChanged: _filterCities,
              decoration: InputDecoration(
                hintText: 'Rechercher une ville...',
                prefixIcon: const Icon(Icons.search_rounded),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
                  borderSide: const BorderSide(color: AppColors.borderGrey),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
                  borderSide:
                      const BorderSide(color: AppColors.primaryBlue, width: 2),
                ),
              ),
            ),
          ),

          // City list
          Expanded(
            child: _filteredCities.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.location_off_rounded,
                          size: 48,
                          color: AppColors.textGrey.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          'Aucune ville trouvée',
                          style: TextStyle(
                            color: AppColors.textGrey.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: EdgeInsets.zero,
                    itemCount: _filteredCities.length,
                    itemBuilder: (context, index) {
                      final city = _filteredCities[index];
                      final isSelected = city == widget.selectedCity;

                      return ListTile(
                        title: Text(city),
                        leading: Icon(
                          isSelected
                              ? Icons.check_circle_rounded
                              : Icons.circle_outlined,
                          color: isSelected
                              ? AppColors.primaryBlue
                              : AppColors.textGrey,
                        ),
                        onTap: () => Navigator.pop(context, city),
                        tileColor: isSelected
                            ? AppColors.primaryBlue.withValues(alpha: 0.08)
                            : null,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

