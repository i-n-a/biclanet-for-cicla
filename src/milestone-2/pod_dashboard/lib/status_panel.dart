// lib/status_panel.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class StatusPanel extends StatefulWidget {
  final DatabaseReference podRef;

  const StatusPanel({super.key, required this.podRef});

  @override
  State<StatusPanel> createState() => _StatusPanelState();
}

class _StatusPanelState extends State<StatusPanel> {
  int timestamp = 0;
  int avgLight = 0;
  int brightness = 0;

  @override
  void initState() {
    super.initState();

    // Sync from Firebase all time – one listener
    widget.podRef.onValue.listen((event) {
      final data = event.snapshot.value as Map<Object?, Object?>?;
      if (data == null) return;

      setState(() {
        timestamp = data['timestamp'] as int? ?? 0;
        avgLight = data['avg_light'] as int? ?? 0;
        brightness = data['brightness'] as int? ?? 0;
      });
    });
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
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Pod Status',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _fakeBox('LUT', timestamp)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _fakeBox('AVG', avgLight)),
                const SizedBox(width: 16),
                Expanded(child: _fakeBox('BRT', brightness)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _fakeBox(String label, int value) {
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
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                label,
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              value.toString(),
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
