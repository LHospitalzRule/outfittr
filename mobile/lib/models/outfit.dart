// Outfit model — represents an outfit composed of one or more items.

import 'item.dart';

class Outfit
{
  final String id;
  final String name;
  final String description;
  final List<String> itemIds;
  final List<Item> items;

  Outfit({
    required this.id,
    required this.name,
    required this.description,
    required this.itemIds,
    required this.items,
  });

  // Builds an Outfit from the backend's buildOutfitResponse shape.
  // Expects outfitId (string), name, description, itemIds (string[]), items (Item[]).
  factory Outfit.fromJson(Map<String, dynamic> json)
  {
    // Prefer the server-computed outfitId; fall back to _id for safety.
    final id = (json['outfitId'] ?? json['_id'] ?? '').toString();

    final rawIds = json['itemIds'];
    final itemIds = rawIds is List ? rawIds.map((e) => e.toString()).toList() : <String>[];

    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems.map((e) => Item.fromJson(Map<String, dynamic>.from(e as Map))).toList()
        : <Item>[];

    return Outfit(
      id: id,
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      itemIds: itemIds,
      items: items,
    );
  }
}
