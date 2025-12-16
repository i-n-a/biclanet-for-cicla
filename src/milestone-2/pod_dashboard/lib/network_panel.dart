// lib/network_panel.dart

import 'dart:async';

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class NetworkPanel extends StatefulWidget {
  const NetworkPanel({super.key});

  @override
  State<NetworkPanel> createState() => _NetworkPanelState();
}

class _NetworkPanelState extends State<NetworkPanel> {
  final List<String> devices = [
    'Pod_01_base_01',
    'Pod_01_entrada_01',
    'Pod_01_Claw_01',
  ];

  Map<String, bool> onlineStatus = {
    'Pod_01_base_01': false,
    'Pod_01_entrada_01': false,
    'Pod_01_Claw_01': false,
  };

  Map<String, Timer?> timers = {};

  @override
  void initState() {
    super.initState();

    for (String device in devices) {
      final ref = FirebaseDatabase.instance.ref('devices/$device');

      ref.onValue.listen((event) {
        final data = event.snapshot.value as Map<Object?, Object?>?;
        if (data == null) return;

        int timestamp = data['timestamp'] as int? ?? 0;
        final settings = data['settings'] as Map<Object?, Object?>?;
        final conn = settings?['connection_package'] as Map<Object?, Object?>?;
        int interval = conn?['send_interval'] as int? ?? 5;

        setState(() {
          onlineStatus[device] = true;
        });

        timers[device]?.cancel();

        int maxWait = interval * 10;
        timers[device] = Timer(Duration(seconds: maxWait), () {
          if (mounted) {
            setState(() {
              onlineStatus[device] = false;
            });
          }
        });
      });
    }
  }

  @override
  void dispose() {
    for (var timer in timers.values) {
      timer?.cancel();
    }
    super.dispose();
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
              'Network',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),
            const Text('Devices online status', style: TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            Column(
              children: devices.map((device) {
                bool online = onlineStatus[device] ?? false;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      Icon(
                        Icons.circle,
                        color: online ? Colors.green[700] : Colors.red[700],
                        size: 12,
                      ),
                      const SizedBox(width: 12),
                      Text(device, style: const TextStyle(fontSize: 16)),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
