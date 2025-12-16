// lib/timestamp.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class TimestampWidget extends StatefulWidget {
  final DatabaseReference podRef;

  const TimestampWidget({super.key, required this.podRef});

  @override
  State<TimestampWidget> createState() => _TimestampWidgetState();
}

class _TimestampWidgetState extends State<TimestampWidget> {
  int timestamp = 0;

  @override
  void initState() {
    super.initState();

    widget.podRef.child('timestamp').onValue.listen((event) {
      final value = event.snapshot.value;
      if (value is int) {
        setState(() {
          timestamp = value;
        });
      }
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
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center, // center vertically
          crossAxisAlignment: CrossAxisAlignment.center, // center horizontally
          children: [
            const Text(
              'Last update timestamp',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Text(
              timestamp.toString(),
              style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
