import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { searchPlaces, getPlaceDetails } from '@/lib/maps';
import type { PlacePrediction } from '@/lib/maps';
import type { ActivityLocation } from '@/types';

interface Props {
  value?: ActivityLocation;
  onChange: (loc: ActivityLocation | undefined) => void;
  placeholder?: string;
}

export function LocationPicker({ value, onChange, placeholder = 'Rechercher une adresse…' }: Props) {
  const [query,       setQuery]       = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [editing,     setEditing]     = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (text.length < 2) { setPredictions([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchPlaces(text);
      setPredictions(results.slice(0, 4));
      setLoading(false);
    }, 380);
  }, []);

  async function selectPlace(pred: PlacePrediction) {
    setPredictions([]);
    setEditing(false);
    setLoading(true);
    const details = await getPlaceDetails(pred.place_id);
    setLoading(false);
    if (details) {
      setQuery('');
      onChange(details);
    }
  }

  function clear() {
    setQuery('');
    setPredictions([]);
    setEditing(false);
    onChange(undefined);
  }

  // ── Selected state ────────────────────────────────────────────────────────
  if (value && !editing) {
    return (
      <TouchableOpacity
        style={s.selected}
        onPress={() => { setEditing(true); setQuery(''); }}
        activeOpacity={0.7}
        accessibilityLabel="Modifier l'adresse"
      >
        <Ionicons name="location" size={15} color={Colors.light.primary} />
        <Text style={s.selectedText} numberOfLines={2}>{value.address}</Text>
        <TouchableOpacity
          onPress={clear}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityLabel="Supprimer l'adresse"
        >
          <Ionicons name="close-circle" size={16} color={Colors.light.ink3} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Search state ──────────────────────────────────────────────────────────
  return (
    <View>
      <View style={s.inputWrap}>
        <Ionicons name="search-outline" size={15} color={Colors.light.ink3} />
        <TextInput
          style={s.input}
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setEditing(true)}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.ink3}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Rechercher une adresse"
        />
        {loading
          ? <ActivityIndicator size="small" color={Colors.light.primary} />
          : query.length > 0
          ? (
            <TouchableOpacity onPress={clear} accessibilityLabel="Effacer la recherche">
              <Ionicons name="close-circle" size={15} color={Colors.light.ink3} />
            </TouchableOpacity>
          ) : null
        }
      </View>

      {predictions.length > 0 && (
        <View style={s.dropdown}>
          {predictions.map((p, i) => (
            <TouchableOpacity
              key={p.place_id}
              style={[s.prediction, i < predictions.length - 1 && s.predBorder]}
              onPress={() => selectPlace(p)}
              accessibilityLabel={p.description}
            >
              <Ionicons name="location-outline" size={13} color={Colors.light.ink3} style={s.predIcon} />
              <View style={s.predText}>
                <Text style={s.predMain} numberOfLines={1}>
                  {p.structured_formatting.main_text}
                </Text>
                <Text style={s.predSub} numberOfLines={1}>
                  {p.structured_formatting.secondary_text}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  selectedText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.light.primaryStrong,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.surfaceSunk,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
    padding: 0,
  },

  dropdown: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.hairline,
  },
  prediction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  predBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.hairline },
  predIcon:   { marginTop: 2 },
  predText:   { flex: 1 },
  predMain:   { fontSize: FontSize.sm, fontWeight: '600', color: Colors.light.ink },
  predSub:    { fontSize: FontSize.xs, fontWeight: '400', color: Colors.light.ink3, marginTop: 1 },
});
