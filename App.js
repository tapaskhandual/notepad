import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, Modal, Alert, Animated, ScrollView, Image, Dimensions, Switch, Platform, ActivityIndicator, Pressable, SectionList, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

//  THEME 
const COLORS = {
  background: '#0f172a', // slate-900
  surface: '#1e293b',    // slate-800
  elevated: '#263548',   // Slightly darker than surface for cards/modals
  accent: '#00d4ff',     // A vibrant blue
  text: '#f1f5f9',       // slate-50
  secondary: '#94a3b8',  // slate-400
  muted: '#64748b',      // slate-500
  success: '#22c55e',    // green-500
  warning: '#f59e0b',    // amber-500
  danger: '#ef4444',     // red-500
  info: '#3b82f6',       // blue-500
  border: '#334155',     // slate-700
};

const NOTE_COLORS = {
  'Blue': '#00d4ff',
  'Green': '#22c55e',
  'Yellow': '#f59e0b',
  'Red': '#ef4444',
  'Purple': '#8b5cf6', // violet-500
  'Gray': '#94a3b8',
  'Orange': '#f97316', // orange-500
};

const TAG_COLORS = {
  'Work': COLORS.info,
  'Personal': COLORS.success,
  'Ideas': COLORS.warning,
  'Shopping': COLORS.accent,
  'Important': COLORS.danger,
  'Reminder': COLORS.purple, // Using a custom color for tags
  'Random': COLORS.muted
};

const SHADOW_STYLE = {
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4.65
};

const { width } = Dimensions.get('window');

//  UTILITY FUNCTIONS 
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};

const getNoteColorHex = (colorName) => NOTE_COLORS[colorName] || COLORS.muted;
const getTagColorHex = (tagName) => TAG_COLORS[tagName] || COLORS.muted;

// AsyncStorage Helpers
const NOTES_STORAGE_KEY = '@notepad_notes';
const SETTINGS_STORAGE_KEY = '@notepad_settings';

const loadNotes = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load notes.', e);
    return [];
  }
};

const saveNotes = async (notes) => {
  try {
    const jsonValue = JSON.stringify(notes);
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save notes.', e);
  }
};

const loadSettings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : { cloudSync: false, hapticFeedback: true };
  } catch (e) {
    console.error('Failed to load settings.', e);
    return { cloudSync: false, hapticFeedback: true };
  }
};

const saveSettings = async (settings) => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save settings.', e);
  }
};

//  SAMPLE DATA 
const initialNotes = [
  {
    id: generateId(),
    title: 'Grocery List',
    content: 'Milk, Eggs, Bread, Butter, Apples, Bananas, Spinach, Chicken Breast. Don\'t forget the organic options!',
    tags: ['Personal', 'Shopping'],
    color: 'Green',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 ago
    modifiedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 ago
    isFavorite: true
  },
  {
    id: generateId(),
    title: 'Meeting Notes - Project Alpha',
    content: 'Discussed Q3 deliverables. Action items: John to finalize design, Sarah to review budget, Mark to prepare presentation for next week. Follow up on client feedback.',
    tags: ['Work', 'Important'],
    color: 'Blue',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 ago
    modifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 ago
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'New App Idea: MindFlow',
    content: 'A journaling app with AI prompts and sentiment analysis. Focus on minimalist UI and offline support. Integrate with calendar for daily reminders. Monetization through premium features.',
    tags: ['Ideas', 'Work'],
    color: 'Yellow',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 ago
    modifiedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(), // 12 ago
    isFavorite: true
  },
  {
    id: generateId(),
    title: 'Weekend Plans',
    content: 'Saturday: Hiking at local park, picnic lunch. Sunday: Movie marathon, try new recipe for dinner (pasta primavera). Call Aunt Mary.',
    tags: ['Personal'],
    color: 'Purple',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 ago
    modifiedAt: new Date().toISOString(), // Just now
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Book Recommendations',
    content: '1. "Dune" by Frank Herbert (Sci-Fi classic). 2. "Atomic Habits" by James Clear (Self-help). 3. "The Midnight Library" by Matt Haig (Contemporary fiction).',
    tags: ['Personal', 'Ideas'],
    color: 'Gray',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Client Follow-up: Acme Corp',
    content: 'Send updated proposal by EOD. Schedule a call for next Tuesday to discuss feedback. Emphasize cost-saving benefits.',
    tags: ['Work', 'Important'],
    color: 'Red',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 0.1).toISOString(), // Few hours ago
    isFavorite: true
  },
  {
    id: generateId(),
    title: 'Recipe: Spicy Chicken Stir-fry',
    content: 'Ingredients: Chicken, bell peppers, onions, broccoli, soy sauce, ginger, garlic, chili flakes. Instructions: Marinate chicken, stir-fry veggies, combine with sauce.',
    tags: ['Personal'],
    color: 'Orange',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Workout Routine',
    content: 'Monday: Chest & Triceps. Tuesday: Back & Biceps. Wednesday: Legs & Shoulders. Thursday: Cardio. Friday: Full Body. Weekend: Rest/Active Recovery.',
    tags: ['Personal', 'Reminder'],
    color: 'Green',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Conference Ideas 2024',
    content: 'Look into "Future of AI" summit. "DevConnect" for mobile development trends. Check speaker lists and early bird registration deadlines.',
    tags: ['Work', 'Ideas'],
    color: 'Blue',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Home Maintenance Checklist',
    content: 'Clean gutters, check smoke detectors, replace air filters, inspect roof for damage, test water heater pressure release valve. Schedule HVAC service.',
    tags: ['Personal', 'Reminder'],
    color: 'Yellow',
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    isFavorite: true
  },
  {
    id: generateId(),
    title: 'Travel Itinerary: Japan',
    content: 'Tokyo (3), Kyoto (4), Osaka (2). Must-sees: Shibuya Crossing, Fushimi Inari, Dotonbori. Research best ramen spots.',
    tags: ['Personal'],
    color: 'Purple',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Project Phoenix Brainstorm',
    content: 'Key features: secure data encryption, real-time collaboration, API integration for third-party tools. Target audience: small businesses.',
    tags: ['Work', 'Ideas'],
    color: 'Red',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Gift Ideas for Mom',
    content: 'Spa day voucher, custom photo album, new plant for her garden, subscription box for tea. Ask Dad for more ideas.',
    tags: ['Personal', 'Shopping'],
    color: 'Orange',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isFavorite: true
  },
  {
    id: generateId(),
    title: 'Learn React Native - Modules',
    content: 'Review Hooks (useState, useEffect, useContext). Practice navigation with React Navigation (or custom state-based). Explore Expo APIs (Location, Haptics).',
    tags: ['Work', 'Ideas'],
    color: 'Blue',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    isFavorite: false
  },
  {
    id: generateId(),
    title: 'Dental Appointment Reminder',
    content: 'Appointment with Dr. Smith on October 26th at 10 AM. Confirm insurance details beforehand. Get directions.',
    tags: ['Personal', 'Reminder', 'Important'],
    color: 'Green',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    modifiedAt: new Date(Date.now() - 86400000 * 0.2).toISOString(), // Few hours ago
    isFavorite: false
  }
];

//  REUSABLE COMPONENTS 

const Header = ({ title, onBack, rightActionIcon, onRightAction, rightActionText }) => {
  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{'<'}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {onRightAction && (
        <TouchableOpacity onPress={onRightAction} style={styles.headerButton}>
          {rightActionIcon && <Text style={styles.headerButtonText}>{rightActionIcon}</Text>}
          {rightActionText && <Text style={styles.headerButtonText}>{rightActionText}</Text>}
        </TouchableOpacity>
      )}
      {!onBack && !onRightAction && <View style={styles.headerButtonPlaceholder} />}
      {onBack && !onRightAction && <View style={styles.headerButtonPlaceholder} />}
      {!onBack && onRightAction && <View style={styles.headerButtonPlaceholder} />}
    </View>
  );
};

const Button = ({ title, onPress, style, textStyle, primary, danger, disabled }) => {
  const buttonBackgroundColor = disabled
    ? COLORS.muted
    : danger
      ? COLORS.danger
      : primary
        ? COLORS.accent
        : COLORS.surface;

  const buttonTextColor = disabled
    ? COLORS.secondary
    : primary || danger
      ? COLORS.text
      : COLORS.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: buttonBackgroundColor },
        style,
        disabled && styles.buttonDisabled
      ]}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: buttonTextColor }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const NoteCard = ({ note, onPress, onToggleFavorite }) => {
  const noteColor = getNoteColorHex(note.color);
  const snippet = note.content.length > 100 ? note.content.substring(0, 97) + '...' : note.content;

  return (
    <TouchableOpacity onPress={() => onPress(note.id)} style={styles.noteCard} activeOpacity={0.8}>
      <View style={[styles.noteCardColorBar, { backgroundColor: noteColor }]} />
      <View style={styles.noteCardContent}>
        <View style={styles.noteCardHeader}>
          <Text style={styles.noteCardTitle} numberOfLines={1}>{note.title}</Text>
          <TouchableOpacity onPress={() => onToggleFavorite(note.id)} style={styles.favoriteButton}>
            <Text style={styles.favoriteIcon}>{note.isFavorite ? '\u2764' : '\u2661'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.noteCardSnippet} numberOfLines={2}>{snippet}</Text>
        <View style={styles.noteCardFooter}>
          <View style={styles.noteCardTags}>
            {note.tags.map((tag, index) => (
              <TagBadge key={index} tag={tag} />
            ))}
          </View>
          <Text style={styles.noteCardDate}>{getTimeAgo(note.modifiedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TagBadge = ({ tag }) => (
  <View style={[styles.tagBadge, { backgroundColor: getTagColorHex(tag) }]}>
    <Text style={styles.tagBadgeText}>{tag}</Text>
  </View>
);

const SearchBar = ({ searchText, onSearchChange, onClearSearch }) => {
  return (
    <View style={styles.searchBarContainer}>
      <TextInput
        style={styles.searchBarInput}
        placeholder="Search notes..."
        placeholderTextColor={COLORS.secondary}
        value={searchText}
        onChangeText={onSearchChange}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={onClearSearch} style={styles.clearSearchButton}>
          <Text style={styles.clearSearchText}>\u274C</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const FilterChip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SortOption = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.sortOption, selected && styles.sortOptionSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.sortOptionText, selected && styles.sortOptionTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const EmptyState = ({ icon, message, ctaText, onCtaPress }) => (
  <View style={styles.emptyStateContainer}>
    <Text style={styles.emptyStateIcon}>{icon}</Text>
    <Text style={styles.emptyStateMessage}>{message}</Text>
    {onCtaPress && (
      <Button title={ctaText} onPress={onCtaPress} primary style={styles.emptyStateCtaButton} />
    )}
  </View>
);

const Toast = ({ message, type, isVisible, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current; // Start 50 below

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true
            }),
            Animated.timing(slideAnim, {
              toValue: 50,
              duration: 300,
              useNativeDriver: true
            })
          ]).start(onDismiss);
        }, 2000); // Display for 2
      });
    }
  }, [isVisible, fadeAnim, slideAnim, onDismiss]);

  if (!isVisible) return null;

  const backgroundColor = type === 'success' ? COLORS.success :
    type === 'danger' ? COLORS.danger :
      type === 'warning' ? COLORS.warning :
        COLORS.info;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { backgroundColor, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const ColorPicker = ({ selectedColor, onSelectColor }) => (
  <View style={styles.colorPickerContainer}>
    {Object.keys(NOTE_COLORS).map((colorName) => (
      <TouchableOpacity
        key={colorName}
        style={[
          styles.colorOption,
          { backgroundColor: NOTE_COLORS[colorName] },
          selectedColor === colorName && styles.colorOptionSelected
        ]}
        onPress={() => onSelectColor(colorName)}
      />
    ))}
  </View>
);

const AnimatedScreen = ({ children, isVisible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current; // Start from right

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          zIndex: isVisible ? 1 : 0, // Ensure visible screen is on top
          backgroundColor: COLORS.background, // Match app background
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

//  SCREEN COMPONENTS 

const HomeScreen = ({ notes, navigateTo, showToast }) => {
  const totalNotes = notes.length;
  const favoriteNotes = notes.filter(n => n.isFavorite).length;
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
      .slice(0, 5);
  }, [notes]);

  const notesByColor = useMemo(() => {
    const counts = {};
    Object.keys(NOTE_COLORS).forEach(color => counts[color] = 0);
    notes.forEach(note => {
      if (note.color && counts[note.color] !== undefined) {
        counts[note.color]++;
      }
    });
    return Object.entries(counts).filter(([, count]) => count > 0);
  }, [notes]);

  const notesByTag = useMemo(() => {
    const counts = {};
    Object.keys(TAG_COLORS).forEach(tag => counts[tag] = 0);
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if (tag && counts[tag] !== undefined) {
          counts[tag]++;
        }
      });
    });
    return Object.entries(counts).filter(([, count]) => count > 0);
  }, [notes]);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Header title="Notepad Dashboard" />
      <ScrollView contentContainerStyle={styles.homeScrollContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalNotes}</Text>
            <Text style={styles.statLabel}>Total Notes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{favoriteNotes}</Text>
            <Text style={styles.statLabel}>Favorites \u2764</Text>
          </View>
        </View>

        {recentNotes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recently Modified</Text>
            <FlatList
              data={recentNotes}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentNoteCard}
                  onPress={() => navigateTo('NoteDetail', { noteId: item.id })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.recentNoteColorBar, { backgroundColor: getNoteColorHex(item.color) }]} />
                  <Text style={styles.recentNoteTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.recentNoteSnippet} numberOfLines={2}>{item.content}</Text>
                  <Text style={styles.recentNoteDate}>{getTimeAgo(item.modifiedAt)}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {notesByColor.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Notes by Color</Text>
            <View style={styles.chartContainer}>
              {notesByColor.map(([colorName, count]) => (
                <View key={colorName} style={styles.chartBarWrapper}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        backgroundColor: NOTE_COLORS[colorName],
                        width: `${(count / totalNotes) * 100}%`
                      }
                    ]}
                  />
                  <Text style={styles.chartLabel}>{colorName} ({count})</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {notesByTag.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Notes by Tag</Text>
            <View style={styles.tagCloudContainer}>
              {notesByTag.map(([tagName, count]) => (
                <View key={tagName} style={[styles.tagCloudItem, { backgroundColor: getTagColorHex(tagName) }]}>
                  <Text style={styles.tagCloudText}>{tagName} ({count})</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {totalNotes === 0 && (
          <EmptyState
            icon="\u{1F4DD}"
            message="You don't have any notes yet. Let's create one!"
            ctaText="Create First Note"
            onCtaPress={() => navigateTo('NoteForm')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const NotesListScreen = ({ notes, navigateTo, onToggleFavorite, showToast, refreshNotes }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [sortBy, setSortBy] = useState('modifiedAt'); // 'modifiedAt', 'createdAt', 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const allColors = useMemo(() => {
    const colors = new Set();
    notes.forEach(note => note.color && colors.add(note.color));
    return Array.from(colors).sort();
  }, [notes]);

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchText.toLowerCase()) ||
        note.content.toLowerCase().includes(searchText.toLowerCase());

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => note.tags.includes(tag));

      const matchesColors = selectedColors.length === 0 ||
        selectedColors.includes(note.color);

      return matchesSearch && matchesTags && matchesColors;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'modifiedAt' || sortBy === 'createdAt') {
        const dateA = new Date(a[sortBy]).getTime();
        const dateB = new Date(b[sortBy]).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [notes, searchText, selectedTags, selectedColors, sortBy, sortOrder]);

  const handleToggleTag = (tag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleToggleColor = (color) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleSortChange = (newSortBy) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sortBy === newSortBy) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to descending for new sort
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshNotes();
    showToast('Notes refreshed!', 'success');
    setIsRefreshing(false);
  }, [refreshNotes, showToast]);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Header title="All Notes" />
      <SearchBar
        searchText={searchText}
        onSearchChange={setSearchText}
        onClearSearch={() => setSearchText('')}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterSortContainer}>
        <Text style={styles.filterSortLabel}>Tags:</Text>
        {allTags.map(tag => (
          <FilterChip
            key={tag}
            label={tag}
            selected={selectedTags.includes(tag)}
            onPress={() => handleToggleTag(tag)}
          />
        ))}
        <Text style={styles.filterSortLabel}>Colors:</Text>
        {allColors.map(color => (
          <FilterChip
            key={color}
            label={color}
            selected={selectedColors.includes(color)}
            onPress={() => handleToggleColor(color)}
          />
        ))}
        <Text style={styles.filterSortLabel}>Sort by:</Text>
        <SortOption
          label={`Title ${sortBy === 'title' ? (sortOrder === 'asc' ? '\u25B2' : '\u25BC') : ''}`}
          selected={sortBy === 'title'}
          onPress={() => handleSortChange('title')}
        />
        <SortOption
          label={`Modified ${sortBy === 'modifiedAt' ? (sortOrder === 'asc' ? '\u25B2' : '\u25BC') : ''}`}
          selected={sortBy === 'modifiedAt'}
          onPress={() => handleSortChange('modifiedAt')}
        />
        <SortOption
          label={`Created ${sortBy === 'createdAt' ? (sortOrder === 'asc' ? '\u25B2' : '\u25BC') : ''}`}
          selected={sortBy === 'createdAt'}
          onPress={() => handleSortChange('createdAt')}
        />
      </ScrollView>

      {filteredAndSortedNotes.length === 0 ? (
        <EmptyState
          icon="\u{1F50D}"
          message="No notes found matching your criteria."
          ctaText="Clear Filters"
          onCtaPress={() => {
            setSearchText('');
            setSelectedTags([]);
            setSelectedColors([]);
          }}
        />
      ) : (
        <FlatList
          data={filteredAndSortedNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={navigateTo}
              onToggleFavorite={onToggleFavorite}
            />
          )}
          contentContainerStyle={styles.flatListContent}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const NoteDetailScreen = ({ route, notes, goBack, navigateTo, onDeleteNote, onToggleFavorite, showToast }) => {
  const { noteId } = route.params;
  const note = useMemo(() => notes.find(n => n.id === noteId), [notes, noteId]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    if (!note) {
      // If note is deleted or not found, go back
      goBack();
      showToast('Note not found or deleted.', 'danger');
    }
  }, [note, goBack, showToast]);

  const handleDeletePress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleteModalVisible(true);
  }, []);

  const confirmDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDeleteNote(noteId);
    setDeleteModalVisible(false);
    goBack();
    showToast('Note deleted successfully!', 'success');
  }, [onDeleteNote, noteId, goBack, showToast]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Simulate sharing
    Alert.alert(
      'Share Note',
      `Sharing "${note.title}" with content:\n\n"${note.content}"`,
      [{ text: 'OK' }]
    );
    showToast('Note shared (simulated)!', 'info');
  }, [note, showToast]);

  if (!note) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <Header title="Note Not Found" onBack={goBack} />
        <EmptyState icon="\u274C" message="Oops! This note doesn't exist anymore." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Header
        title={note.title}
        onBack={goBack}
        rightActionIcon={note.isFavorite ? '\u2764' : '\u2661'}
        onRightAction={() => {
          onToggleFavorite(note.id);
          showToast(note.isFavorite ? 'Removed from favorites' : 'Added to favorites', 'info');
        }}
      />
      <ScrollView contentContainerStyle={styles.detailScrollViewContent}>
        <View style={[styles.detailColorBar, { backgroundColor: getNoteColorHex(note.color) }]} />
        <Text style={styles.detailContent}>{note.content}</Text>

        <View style={styles.detailMetaContainer}>
          <Text style={styles.detailMetaText}>
            <Text style={{ fontWeight: 'bold' }}>Created:</Text> {formatDate(note.createdAt)}
          </Text>
          <Text style={styles.detailMetaText}>
            <Text style={{ fontWeight: 'bold' }}>Last Modified:</Text> {formatDate(note.modifiedAt)} ({getTimeAgo(note.modifiedAt)})
          </Text>
        </View>

        <View style={styles.detailTagsContainer}>
          <Text style={styles.detailTagsLabel}>Tags:</Text>
          <View style={styles.detailTagsList}>
            {note.tags.length > 0 ? (
              note.tags.map((tag, index) => <TagBadge key={index} tag={tag} />)
            ) : (
              <Text style={styles.detailMetaText}>No tags</Text>
            )}
          </View>
        </View>

        <View style={styles.detailActions}>
          <Button title="\u270F Edit" onPress={() => navigateTo('NoteForm', { noteId: note.id })} primary style={styles.detailActionButton} />
          <Button title="\u{1F4E4} Share" onPress={handleShare} style={styles.detailActionButton} />
          <Button title="\u{1F5D1} Delete" onPress={handleDeletePress} danger style={styles.detailActionButton} />
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalMessage}>Are you sure you want to delete "{note.title}"? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setDeleteModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Delete" onPress={confirmDelete} danger style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const NoteFormScreen = ({ route, notes, goBack, onSaveNote, showToast }) => {
  const { noteId } = route.params || {};
  const isEditing = !!noteId;
  const existingNote = isEditing ? notes.find(n => n.id === noteId) : null;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [selectedTags, setSelectedTags] = useState(existingNote?.tags || []);
  const [selectedColor, setSelectedColor] = useState(existingNote?.color || 'Blue');
  const [errors, setErrors] = useState({});

  const availableTags = useMemo(() => Object.keys(TAG_COLORS), []);

  useEffect(() => {
    // If editing a note that no longer exists, go back
    if (isEditing && !existingNote) {
      goBack();
      showToast('Note to edit not found.', 'danger');
    }
  }, [isEditing, existingNote, goBack, showToast]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title cannot be empty.';
    if (!content.trim()) newErrors.content = 'Content cannot be empty.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!validateForm()) {
      showToast('Please fix the errors in the form.', 'danger');
      return;
    }

    const now = new Date().toISOString();
    const newNote = {
      id: isEditing ? noteId : generateId(),
      title,
      content,
      tags: selectedTags,
      color: selectedColor,
      createdAt: existingNote?.createdAt || now,
      modifiedAt: now,
      isFavorite: existingNote?.isFavorite || false
    };
    onSaveNote(newNote);
    goBack();
    showToast(`Note ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
  }, [isEditing, noteId, title, content, selectedTags, selectedColor, existingNote, onSaveNote, goBack, validateForm, showToast]);

  const handleToggleTag = useCallback((tag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Header
        title={isEditing ? 'Edit Note' : 'Create Note'}
        onBack={goBack}
        rightActionText="Save"
        onRightAction={handleSave}
      />
      <ScrollView contentContainerStyle={styles.formScrollViewContent}>
        <Text style={styles.formLabel}>Title</Text>
        <TextInput
          style={[styles.formInput, errors.title && styles.inputError]}
          placeholder="Note Title"
          placeholderTextColor={COLORS.secondary}
          value={title}
          onChangeText={setTitle}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

        <Text style={styles.formLabel}>Content</Text>
        <TextInput
          style={[styles.formInput, styles.formContentInput, errors.content && styles.inputError]}
          placeholder="Write your note here..."
          placeholderTextColor={COLORS.secondary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
        {errors.content && <Text style={styles.errorText}>{errors.content}</Text>}

        <Text style={styles.formLabel}>Color</Text>
        <ColorPicker selectedColor={selectedColor} onSelectColor={setSelectedColor} />

        <Text style={styles.formLabel}>Tags</Text>
        <View style={styles.tagSelectorContainer}>
          {availableTags.map(tag => (
            <FilterChip
              key={tag}
              label={tag}
              selected={selectedTags.includes(tag)}
              onPress={() => handleToggleTag(tag)}
            />
          ))}
        </View>

        <Button title={isEditing ? "Update Note" : "Create Note"} onPress={handleSave} primary style={styles.formSubmitButton} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileScreen = ({ settings, onUpdateSettings, goBack, showToast }) => {
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(settings.cloudSync);
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState(settings.hapticFeedback);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCloudSyncEnabled(settings.cloudSync);
    setHapticFeedbackEnabled(settings.hapticFeedback);
  }, [settings]);

  const handleCloudSyncToggle = useCallback((value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCloudSyncEnabled(value);
    onUpdateSettings({ ...settings, cloudSync: value });
    showToast(`Cloud Sync ${value ? 'enabled' : 'disabled'}`, 'info');
  }, [settings, onUpdateSettings, showToast]);

  const handleHapticFeedbackToggle = useCallback((value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHapticFeedbackEnabled(value);
    onUpdateSettings({ ...settings, hapticFeedback: value });
    showToast(`Haptic Feedback ${value ? 'enabled' : 'disabled'}`, 'info');
  }, [settings, onUpdateSettings, showToast]);

  const handleCloudBackup = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(true);
    showToast('Initiating cloud backup...', 'info');
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      showToast('Cloud backup complete!', 'success');
    }, 2000);
  }, [showToast]);

  const handleContactSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const email = 'support@notepadapp.com';
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Could not open email client. Please contact support at ' + email);
    });
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Header title="Settings & Profile" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.profileScrollViewContent}>
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>User:</Text>
            <Text style={styles.profileValue}>Notepad User \u{1F464}</Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Email:</Text>
            <Text style={styles.profileValue}>user@example.com</Text>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Sync & Backup</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Cloud Sync</Text>
            <Switch
              trackColor={{ false: COLORS.muted, true: COLORS.accent }}
              thumbColor={cloudSyncEnabled ? COLORS.text : COLORS.secondary}
              ios_backgroundColor={COLORS.muted}
              onValueChange={handleCloudSyncToggle}
              value={cloudSyncEnabled}
            />
          </View>
          <Button
            title={isLoading ? 'Backing up...' : '\u{1F504} Sync Notes Now'}
            onPress={handleCloudBackup}
            disabled={isLoading}
            style={styles.profileActionButton}
          />
          <Text style={styles.settingDescription}>
            Syncs your notes to a simulated cloud service for backup and cross-device access.
          </Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Switch
              trackColor={{ false: COLORS.muted, true: COLORS.accent }}
              thumbColor={hapticFeedbackEnabled ? COLORS.text : COLORS.secondary}
              ios_backgroundColor={COLORS.muted}
              onValueChange={handleHapticFeedbackToggle}
              value={hapticFeedbackEnabled}
            />
          </View>
          <Text style={styles.settingDescription}>
            Provides subtle vibrations for button presses and actions.
          </Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Version:</Text>
            <Text style={styles.profileValue}>1.0.0</Text>
          </View>
          <Button
            title="\u{1F4DE} Contact Support"
            onPress={handleContactSupport}
            style={styles.profileActionButton}
          />
          <Text style={styles.settingDescription}>
            For any questions or issues, feel free to reach out.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

//  MAIN APP 
const App = () => {
  const [notes, setNotes] = useState([]);
  const [settings, setSettings] = useState({ cloudSync: false, hapticFeedback: true });
  const [activeTab, setActiveTab] = useState('home');
  const [screenStack, setScreenStack] = useState([{ name: 'Home', params: {} }]); // [{ name: 'Home', params: {} }, { name: 'NoteDetail', params: { noteId: '123' } }]
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  const currentScreen = useMemo(() => screenStack[screenStack.length - 1], [screenStack]);

  const showToast = useCallback((message, type = 'info') => {
    Haptics.notificationAsync(
      type === 'success' ? Haptics.NotificationFeedbackType.Success :
        type === 'danger' ? Haptics.NotificationFeedbackType.Error :
          Haptics.NotificationFeedbackType.Warning
    );
    setToast({ message, type, isVisible: true });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const loadAppData = useCallback(async () => {
    setIsLoadingApp(true);
    const storedNotes = await loadNotes();
    const storedSettings = await loadSettings();

    if (storedNotes.length === 0) {
      setNotes(initialNotes); // Use sample data if no notes are stored
      await saveNotes(initialNotes);
    } else {
      setNotes(storedNotes);
    }
    setSettings(storedSettings);
    setIsLoadingApp(false);
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  const refreshNotes = useCallback(async () => {
    const storedNotes = await loadNotes();
    setNotes(storedNotes);
  }, []);

  const navigateTo = useCallback((screenName, params = {}) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenStack(prev => [...prev, { name: screenName, params }]);
  }, []);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenStack(prev => {
      if (prev.length > 1) {
        return prev.slice(0, prev.length - 1);
      }
      return prev; // Stay on the current screen if it's the root
    });
  }, []);

  const handleSaveNote = useCallback(async (newNote) => {
    let updatedNotes;
    if (notes.some(n => n.id === newNote.id)) {
      updatedNotes = notes.map(n => (n.id === newNote.id ? newNote : n));
    } else {
      updatedNotes = [...notes, newNote];
    }
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  }, [notes]);

  const handleDeleteNote = useCallback(async (noteId) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  }, [notes]);

  const handleToggleFavorite = useCallback(async (noteId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedNotes = notes.map(n =>
      n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n
    );
    setNotes(updatedNotes);
    await saveNotes(updatedNotes);
  }, [notes]);

  const handleUpdateSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, []);

  const renderScreen = useCallback((screen) => {
    switch (screen.name) {
      case 'Home':
        return <HomeScreen notes={notes} navigateTo={navigateTo} showToast={showToast} />;
      case 'NotesList':
        return <NotesListScreen notes={notes} navigateTo={navigateTo} onToggleFavorite={handleToggleFavorite} showToast={showToast} refreshNotes={refreshNotes} />;
      case 'NoteDetail':
        return <NoteDetailScreen route={screen} notes={notes} goBack={goBack} navigateTo={navigateTo} onDeleteNote={handleDeleteNote} onToggleFavorite={handleToggleFavorite} showToast={showToast} />;
      case 'NoteForm':
        return <NoteFormScreen route={screen} notes={notes} goBack={goBack} onSaveNote={handleSaveNote} showToast={showToast} />;
      case 'Profile':
        return <ProfileScreen settings={settings} onUpdateSettings={handleUpdateSettings} goBack={goBack} showToast={showToast} />;
      default:
        return <HomeScreen notes={notes} navigateTo={navigateTo} showToast={showToast} />;
    }
  }, [notes, settings, navigateTo, goBack, handleSaveNote, handleDeleteNote, handleToggleFavorite, handleUpdateSettings, showToast, refreshNotes]);

  const isDetailOrFormScreen = currentScreen.name === 'NoteDetail' || currentScreen.name === 'NoteForm' || currentScreen.name === 'Profile';

  if (isLoadingApp) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading your notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" backgroundColor={COLORS.surface} />

      {/* Main Tab Screens */}
      <AnimatedScreen isVisible={activeTab === 'home' && !isDetailOrFormScreen}>
        <HomeScreen notes={notes} navigateTo={navigateTo} showToast={showToast} />
      </AnimatedScreen>
      <AnimatedScreen isVisible={activeTab === 'browse' && !isDetailOrFormScreen}>
        <NotesListScreen notes={notes} navigateTo={navigateTo} onToggleFavorite={handleToggleFavorite} showToast={showToast} refreshNotes={refreshNotes} />
      </AnimatedScreen>
      <AnimatedScreen isVisible={activeTab === 'add' && !isDetailOrFormScreen}>
        <NoteFormScreen notes={notes} goBack={() => setActiveTab('home')} onSaveNote={handleSaveNote} showToast={showToast} />
      </AnimatedScreen>
      <AnimatedScreen isVisible={activeTab === 'profile' && !isDetailOrFormScreen}>
        <ProfileScreen settings={settings} onUpdateSettings={handleUpdateSettings} goBack={() => setActiveTab('home')} showToast={showToast} />
      </AnimatedScreen>

      {/* Detail/Form Screens (rendered on top of tabs) */}
      <AnimatedScreen isVisible={isDetailOrFormScreen}>
        {renderScreen(currentScreen)}
      </AnimatedScreen>

      {!isDetailOrFormScreen && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('home'); setScreenStack([{ name: 'Home', params: {} }]); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>\u{1F3E0}</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('browse'); setScreenStack([{ name: 'NotesList', params: {} }]); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'browse' && styles.tabIconActive]}>\u{1F50D}</Text>
            <Text style={[styles.tabLabel, activeTab === 'browse' && styles.tabLabelActive]}>Browse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setActiveTab('add'); setScreenStack([{ name: 'NoteForm', params: {} }]); }}
          >
            <View style={styles.addNoteButton}>
              <Text style={styles.addNoteIcon}>\u2795</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('favorites'); setScreenStack([{ name: 'NotesList', params: { filter: 'favorites' } }]); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'favorites' && styles.tabIconActive]}>\u2764</Text>
            <Text style={[styles.tabLabel, activeTab === 'favorites' && styles.tabLabelActive]}>Favorites</Text>
            {notes.filter(n => n.isFavorite).length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{notes.filter(n => n.isFavorite).length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('profile'); setScreenStack([{ name: 'Profile', params: {} }]); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>\u{1F464}</Text>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onDismiss={dismissToast}
      />
    </View>
  );
};

//  STYLES 
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 16,
    fontSize: 18
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerButton: {
    padding: 8
  },
  headerButtonText: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '600'
  },
  headerButtonPlaceholder: {
    width: 40, // Match button width for alignment
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center'
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8, // Adjust for iPhone X safe area
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative'
  },
  tabIcon: {
    fontSize: 24,
    color: COLORS.secondary
  },
  tabIconActive: {
    color: COLORS.accent
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: '500'
  },
  tabLabelActive: {
    color: COLORS.accent
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: 18,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  tabBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold'
  },
  addNoteButton: {
    backgroundColor: COLORS.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW_STYLE,
    marginBottom: Platform.OS === 'ios' ? 20 : 0
  },
  addNoteIcon: {
    fontSize: 28,
    color: COLORS.text
  },

  // Buttons
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_STYLE
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.6
  },

  // Note Card
  noteCard: {
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOW_STYLE
  },
  noteCardColorBar: {
    width: 8,
    backgroundColor: COLORS.accent
  },
  noteCardContent: {
    flex: 1,
    padding: 16
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  noteCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flexShrink: 1,
    marginRight: 10
  },
  favoriteButton: {
    padding: 4
  },
  favoriteIcon: {
    fontSize: 22,
    color: COLORS.danger
  },
  noteCardSnippet: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 10,
    lineHeight: 20
  },
  noteCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8
  },
  noteCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1
  },
  tagBadge: {
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: COLORS.muted
  },
  tagBadgeText: {
    color: COLORS.text,
    fontSize: 12
  },
  noteCardDate: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 10
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.elevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    ...SHADOW_STYLE
  },
  searchBarInput: {
    flex: 1,
    height: 48,
    color: COLORS.text,
    fontSize: 16
  },
  clearSearchButton: {
    padding: 8
  },
  clearSearchText: {
    color: COLORS.secondary,
    fontSize: 18
  },

  // Filter & Sort
  filterSortContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center'
  },
  filterSortLabel: {
    color: COLORS.secondary,
    fontSize: 14,
    marginRight: 8,
    fontWeight: '500'
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  filterChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent
  },
  filterChipText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '500'
  },
  filterChipTextSelected: {
    color: COLORS.text
  },
  sortOption: {
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sortOptionSelected: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info
  },
  sortOptionText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '500'
  },
  sortOptionTextSelected: {
    color: COLORS.text
  },

  // FlatList content
  flatListContent: {
    paddingBottom: 100, // Space for tab bar
    paddingTop: 8
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyStateIcon: {
    fontSize: 60,
    color: COLORS.muted,
    marginBottom: 16
  },
  emptyStateMessage: {
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26
  },
  emptyStateCtaButton: {
    width: '70%',
    alignSelf: 'center'
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    ...SHADOW_STYLE
  },
  toastText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500'
  },

  // Home Screen
  homeScrollContainer: {
    paddingBottom: 100, // Space for tab bar
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  statCard: {
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    ...SHADOW_STYLE
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.accent
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4
  },
  horizontalListContainer: {
    paddingVertical: 8,
    paddingLeft: 0,
    paddingRight: 10
  },
  recentNoteCard: {
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    width: width * 0.7, // 70% of screen width
    marginRight: 12,
    overflow: 'hidden',
    ...SHADOW_STYLE,
    paddingBottom: 16
  },
  recentNoteColorBar: {
    height: 6,
    backgroundColor: COLORS.accent,
    marginBottom: 12
  },
  recentNoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    paddingHorizontal: 16
  },
  recentNoteSnippet: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
    marginBottom: 8,
    paddingHorizontal: 16
  },
  recentNoteDate: {
    fontSize: 11,
    color: COLORS.muted,
    paddingHorizontal: 16
  },
  chartContainer: {
    paddingVertical: 10
  },
  chartBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  chartBar: {
    height: 20,
    borderRadius: 10,
    marginRight: 10
  },
  chartLabel: {
    color: COLORS.secondary,
    fontSize: 14
  },
  tagCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  tagCloudItem: {
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.muted
  },
  tagCloudText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500'
  },

  // Note Detail Screen
  detailScrollViewContent: {
    paddingBottom: 20
  },
  detailColorBar: {
    height: 10,
    backgroundColor: COLORS.accent,
    marginBottom: 20
  },
  detailContent: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 16
  },
  detailMetaContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16
  },
  detailMetaText: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 4
  },
  detailTagsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20
  },
  detailTagsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  detailTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginTop: 20
  },
  detailActionButton: {
    flex: 1,
    marginHorizontal: 5
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    ...SHADOW_STYLE
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center'
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  // Note Form Screen
  formScrollViewContent: {
    padding: 16,
    paddingBottom: 20
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16
  },
  formInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  formContentInput: {
    minHeight: 120
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 2
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8
  },
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    margin: 4,
    ...SHADOW_STYLE
  },
  colorOptionSelected: {
    borderColor: COLORS.accent
  },
  tagSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16
  },
  formSubmitButton: {
    marginTop: 24
  },

  // Profile Screen
  profileScrollViewContent: {
    padding: 16,
    paddingBottom: 20
  },
  profileSection: {
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...SHADOW_STYLE
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  profileLabel: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '500'
  },
  profileValue: {
    fontSize: 15,
    color: COLORS.text
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500'
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18
  },
  profileActionButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: COLORS.info
  }
});

export default App;