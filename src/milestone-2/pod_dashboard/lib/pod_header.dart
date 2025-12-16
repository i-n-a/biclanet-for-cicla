// lib/pod_header.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

import 'online_chip.dart';

class PodHeader extends StatelessWidget {
  final DatabaseReference podRef;

  const PodHeader({super.key, required this.podRef});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      color: const Color(0xFFF5F5F5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Pod Control: POD-GCT-001A',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              OnlineChip(podRef: podRef),
            ],
          ),
          const SizedBox(height: 8),
          // Wrap subtitle to next line on small screen
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < 500) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Row(
                      children: [
                        Icon(Icons.star_border, size: 20, color: Colors.grey),
                        SizedBox(width: 8),
                        Text('IADE Central Hub',
                            style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.description_outlined,
                            size: 20, color: Colors.grey),
                        SizedBox(width: 8),
                        Text('Firmware: v2.3.1',
                            style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  ],
                );
              }
              return Row(
                children: const [
                  Icon(Icons.star_border, size: 20, color: Colors.grey),
                  SizedBox(width: 8),
                  Text('IADE Central Hub',
                      style: TextStyle(color: Colors.grey)),
                  SizedBox(width: 20),
                  Icon(Icons.description_outlined,
                      size: 20, color: Colors.grey),
                  SizedBox(width: 8),
                  Text('Firmware: v2.3.1',
                      style: TextStyle(color: Colors.grey)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
