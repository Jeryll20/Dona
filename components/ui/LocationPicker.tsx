import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { searchAddresses } from '@/lib/maps';
import type { AddressResult } from '@/lib/maps';
import type { ActivityLocation } from '@/types';

interface Props {
  value?: ActivityLocation;
  onChange: (loc: ActivityLocation | undefined) => void;
  placeholder?: string;
}

export function LocationPicker({ value, onChange, placeholder = 'Rechercher une adresse…' }: Props) {
  const C = useColors();
  const s = makeStyles(C);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (text.length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const found = await searchAddresses(text);
      setResults(found);
      setLoading(false);
    }, 500);
  }, []);

  function selectResult(r: AddressResult) {
    setResults([]);
    setEditing(false);
    setQuery('');
    onChange({ address: r.address, lat: r.lat, lng: r.lng });
  }

  function confirmManual() {
    if (!query.trim()) return;
    setResults([]);
    setEditing(false);
    // No lat/lng — address saved as text only (travel time won't be computed)
    onChange({ address: query.trim(), lat: 0, lng: 0 });
    setQuery('');
  }

  function clear() {
    setQuery('');
    setResults([]);
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
        <Ionicons name="location" size={15} color={C.primary} />
        <Text style={s.selectedText} numberOfLines={2}>{value.address}</Text>
        <TouchableOpacity
          onPress={clear}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityLabel="Supprimer l'adresse"
        >
          <Ionicons name="close-circle" size={16} color={C.ink3} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Search state ──────────────────────────────────────────────────────────
  return (
    <View>
      <View style={s.inputWrap}>
        <Ionicons name="search-outline" size={15} color={C.ink3} />
        <TextInput
          style={s.input}
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setEditing(true)}
          onSubmitEditing={confirmManual}
          placeholder={placeholder}
          placeholderTextColor={C.ink3}
          returnKeyType="done"
          autoCorrect={false}
          accessibilityLabel="Rechercher une adresse"
        />
        {loading
          ? <ActivityIndicator size="small" color={C.primary} />
          : query.length > 0
          ? (
            <TouchableOpacity onPress={clear} accessibilityLabel="Effacer">
              <Ionicons name="close-circle" size={15} color={C.ink3} />
            </TouchableOpacity>
          ) : null
        }
      </View>

      {results.length > 0 ? (
        <View style={s.dropdown}>
          {results.map((r, i) => (
            <TouchableOpacity
              key={r.id}
              style={[s.prediction, i < results.length - 1 && s.predBorder]}
              onPress={() => selectResult(r)}
              accessibilityLabel={r.address}
            >
              <Ionicons name="location-outline" size={13} color={C.ink3} style={s.predIcon} />
              <Text style={s.predText} numberOfLines={2}>{r.address}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : query.length >= 3 && !loading ? (
        <Text style={s.noResult}>
          Adresse introuvable — appuie sur "OK" pour la saisir manuellement.
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    selected: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: C.primaryTint,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: C.primary,
    },
    selectedText: {
      flex: 1,
      fontSize: FontSize.sm,
      fontWeight: '500',
      color: C.primaryStrong,
    },

    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.base,
    },
    input: {
      flex: 1,
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
      padding: 0,
    },

    dropdown: {
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      marginTop: 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: C.hairline,
    },
    prediction: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
    },
    predBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
    predIcon:   { marginTop: 2, flexShrink: 0 },
    predText:   { flex: 1, fontSize: FontSize.sm, fontWeight: '500', color: C.ink, lineHeight: 18 },
    noResult:   { fontSize: FontSize.xs, color: C.ink3, fontStyle: 'italic', marginTop: 6, paddingHorizontal: 2 },
  });
}
