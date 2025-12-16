// lib/top_bar.dart

import 'package:flutter/material.dart';

class TopBar extends StatelessWidget {
  final bool smallScreen;

  const TopBar({super.key, this.smallScreen = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 70,
      color: const Color(0xFFF5F7F5),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            label: Text(
              smallScreen ? '' : 'Back to Dashboard',
              style: const TextStyle(color: Colors.black, fontSize: 16),
            ),
          ),
          const Spacer(),
          if (!smallScreen)
            SizedBox(
              width: 320,
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search Pod ID or Location...',
                  hintStyle: const TextStyle(color: Colors.grey),
                  prefixIcon: const Icon(Icons.search, color: Colors.grey),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.search, color: Colors.grey),
              onPressed: () {},
            ),
        ],
      ),
    );
  }
}
