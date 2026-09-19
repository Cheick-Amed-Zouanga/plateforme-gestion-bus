import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class DatePickerField extends StatefulWidget {
  final DateTime? value;
  final ValueChanged<DateTime> onDateSelected;
  final String label;
  final String? hint;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final String? Function(DateTime?)? validator;

  const DatePickerField({
    super.key,
    this.value,
    required this.onDateSelected,
    required this.label,
    this.hint,
    this.firstDate,
    this.lastDate,
    this.validator,
  });

  @override
  State<DatePickerField> createState() => _DatePickerFieldState();
}

class _DatePickerFieldState extends State<DatePickerField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  bool _isFocused = false;

  late DateTime _firstDate;
  late DateTime _lastDate;

  @override
  void initState() {
    super.initState();
    _firstDate = widget.firstDate ?? DateTime.now();
    _lastDate = widget.lastDate ?? DateTime.now().add(const Duration(days: 90));

    _controller = TextEditingController(
      text: widget.value != null
          ? DateFormat('dd MMM yyyy', 'fr_FR').format(widget.value!)
          : '',
    );
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(DatePickerField oldWidget) {
    super.didUpdateWidget(oldWidget);
    _firstDate = widget.firstDate ?? DateTime.now();
    _lastDate = widget.lastDate ?? DateTime.now().add(const Duration(days: 90));
    if (oldWidget.value != widget.value) {
      _controller.text = widget.value == null
          ? ''
          : DateFormat('dd MMM yyyy', 'fr_FR').format(widget.value!);
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

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: widget.value ?? _firstDate,
      firstDate: _firstDate,
      lastDate: _lastDate,
      locale: const Locale('fr', 'FR'),
    );

    if (mounted && picked != null) {
      setState(() {
        _controller.text = DateFormat('dd MMM yyyy', 'fr_FR').format(picked);
      });
      widget.onDateSelected(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _pickDate,
      child: TextFormField(
        onTap: _pickDate,
        controller: _controller,
        focusNode: _focusNode,
        readOnly: true,
        validator: widget.validator != null
            ? (value) => widget.validator!(widget.value)
            : null,
        style: const TextStyle(
          fontSize: 14,
          color: AppColors.textBody,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          labelStyle: TextStyle(
            color: _isFocused ? AppColors.primaryBlue : AppColors.textGrey,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          hintStyle: const TextStyle(
            color: AppColors.textLight,
            fontSize: 14,
          ),
          prefixIcon: Icon(
            Icons.calendar_today_rounded,
            size: 20,
            color:
                _isFocused ? AppColors.primaryBlue : AppColors.textGrey,
          ),
          suffixIcon: Icon(
            Icons.arrow_drop_down_rounded,
            color: _isFocused ? AppColors.primaryBlue : AppColors.textGrey,
            size: 24,
          ),
          filled: true,
          fillColor: AppColors.surface,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
            borderSide: const BorderSide(
              color: AppColors.borderGrey,
              width: 1,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
            borderSide: const BorderSide(
              color: AppColors.borderGrey,
              width: 1,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
            borderSide: const BorderSide(
              color: AppColors.primaryBlue,
              width: 2,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
            borderSide: const BorderSide(
              color: AppColors.errorRed,
              width: 1,
            ),
          ),
        ),
      ),
    );
  }
}

