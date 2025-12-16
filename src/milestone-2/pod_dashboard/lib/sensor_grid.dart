// lib/sensor_grid.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class SensorGrid extends StatefulWidget {
  final DatabaseReference podRef;

  const SensorGrid({super.key, required this.podRef});

  @override
  State<SensorGrid> createState() => _SensorGridState();
}

class _SensorGridState extends State<SensorGrid> {
  Map<String, int> sensorValues = {
    'sensor0': 0,
    'sensor1': 0,
    'sensor2': 0,
    'sensor3': 0,
  };

  @override
  void initState() {
    super.initState();

    widget.podRef.child('sensors_data').onValue.listen((event) {
      final data = event.snapshot.value as Map<Object?, Object?>?;
      if (data == null) return;

      setState(() {
        sensorValues['sensor0'] = data['sensor0'] as int? ?? 0;
        sensorValues['sensor1'] = data['sensor1'] as int? ?? 0;
        sensorValues['sensor2'] = data['sensor2'] as int? ?? 0;
        sensorValues['sensor3'] = data['sensor3'] as int? ?? 0;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
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
              'Slot-Level Occupancy',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 1.8,
              mainAxisSpacing: 20,
              crossAxisSpacing: 20,
              children: [
                _sensorBox('SL1', sensorValues['sensor0']!),
                _sensorBox('SL2', sensorValues['sensor1']!),
                _sensorBox('SL3', sensorValues['sensor2']!),
                _sensorBox('SL4', sensorValues['sensor3']!),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _sensorBox(String label, int value) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value.toString(),
            style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
