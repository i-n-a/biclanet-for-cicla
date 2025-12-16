// lib/light_settings.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class LightSettings extends StatefulWidget {
  final DatabaseReference podRef;

  const LightSettings({super.key, required this.podRef});

  @override
  State<LightSettings> createState() => _LightSettingsState();
}

class _LightSettingsState extends State<LightSettings> {
  int lightThreshold = 1000;
  int minLight = 200;
  int targetLight = 1000;

  @override
  void initState() {
    super.initState();

    // Sync from Firebase all time
    widget.podRef.child('settings/light_mapping').onValue.listen((event) {
      final data = event.snapshot.value as Map<Object?, Object?>?;
      if (data == null) return;

      setState(() {
        lightThreshold = data['light_threshold'] as int? ?? 1000;
        minLight = data['min_light'] as int? ?? 200;
        targetLight = data['target_light'] as int? ?? 1000;
      });
    });
  }

  void _updateValue(String path, int value) {
    widget.podRef.child('settings/light_mapping/$path').set(value);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Light Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),

            // light_threshold
            _sliderRow(
              label: 'Light threshold',
              value: lightThreshold,
              min: 0,
              max: 4095,
              onChanged: (v) => _updateValue('light_threshold', v),
            ),
            const SizedBox(height: 30),

            // min_light
            _sliderRow(
              label: 'Min light',
              value: minLight,
              min: 0,
              max: 4095,
              onChanged: (v) => _updateValue('min_light', v),
            ),
            const SizedBox(height: 30),

            // target_light
            _sliderRow(
              label: 'Target light',
              value: targetLight,
              min: 0,
              max: 4095,
              onChanged: (v) => _updateValue('target_light', v),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sliderRow({
    required String label,
    required int value,
    required int min,
    required int max,
    required Function(int) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$label: $value',
          style: const TextStyle(fontSize: 16),
        ),
        Slider(
          min: min.toDouble(),
          max: max.toDouble(),
          value: value.toDouble(),
          onChanged: (v) {
            int intValue = v.round();
            setState(() {
              value = intValue;
            });
            onChanged(intValue);
          },
        ),
      ],
    );
  }
}
