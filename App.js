import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, Modal, Alert, Animated, ScrollView, Image, Dimensions, Switch, Platform, ActivityIndicator, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

//  THEME 
const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#0f172a',
  surface: '#1e293b',
  elevated: '#263548',
  accent: '#00d4ff',
  text: '#f1f5f9',
  secondary: '#94a3b8',
  muted: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444'
};

const SHADOWS = {
  card: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65
  }
};

const SPACING = {
  small: 8,
  medium: 16,
  large: 24,
  xl: 32
};

const BORDER_RADIUS = {
  card: 16,
  button: 12,
  chip: 25,
  input: 10,
  modal: 20
};

//  SAMPLE DATA 
const SAMPLE_NOTES = [
  { id: '1', title: 'Meeting Notes - Project X', content: 'Discussed Q3 strategy, assigned tasks to John and Sarah. Follow up on budget. Next meeting on Friday.', category: 'Work', priority: 'High', createdAt: new Date('2023-10-26T10:00:00Z').toISOString(), updatedAt: new Date('2023-10-26T10:00:00Z').toISOString(), isFavorite: false, location: { latitude: 37.78825, longitude: -122.4324, name: 'Office HQ' } },
  { id: '2', title: 'Grocery List', content: 'Milk, Eggs, Bread, Butter, Apples, Spinach, Chicken Breast, Pasta, Tomato Sauce.', category: 'Personal', priority: 'Medium', createdAt: new Date('2023-10-25T15:30:00Z').toISOString(), updatedAt: new Date('2023-10-25T15:30:00Z').toISOString(), isFavorite: true, location: { latitude: 37.7749, longitude: -122.4194, name: 'Grocery Store' } },
  { id: '3', title: 'Ideas for Weekend Trip', content: 'Visit national park, explore new hiking trails, pack a picnic. Check weather forecast.', category: 'Travel', priority: 'Low', createdAt: new Date('2023-10-24T08:00:00Z').toISOString(), updatedAt: new Date('2023-10-24T08:00:00Z').toISOString(), isFavorite: false, location: { latitude: 34.0522, longitude: -118.2437, name: 'Hiking Spot' } },
  { id: '4', title: 'Book Recommendation: "The Alchemist"', content: 'Paulo Coelho. Themes of destiny, personal legend, and following your dreams. Must read!', category: 'Books', priority: 'Medium', createdAt: new Date('2023-10-23T12:00:00Z').toISOString(), updatedAt: new Date('2023-10-23T12:00:00Z').toISOString(), isFavorite: true },
  { id: '5', title: 'Recipe: Spicy Chili', content: 'Ground beef, kidney beans, diced tomatoes, chili powder, cumin, cayenne pepper. Cook low and slow.', category: 'Cooking', priority: 'High', createdAt: new Date('2023-10-22T18:00:00Z').toISOString(), updatedAt: new Date('2023-10-22T18:00:00Z').toISOString(), isFavorite: false },
  { id: '6', title: 'Project Alpha Brainstorm', content: 'New features: user profiles, real-time sync, offline mode. Marketing strategy: social media campaign.', category: 'Work', priority: 'High', createdAt: new Date('2023-10-21T09:30:00Z').toISOString(), updatedAt: new Date('2023-10-21T09:30:00Z').toISOString(), isFavorite: false },
  { id: '7', title: 'Workout Plan', content: 'Monday: Chest & Triceps. Tuesday: Back & Biceps. Wednesday: Legs & Shoulders. Thursday: Rest. Friday: Full Body.', category: 'Health', priority: 'Medium', createdAt: new Date('2023-10-20T07:00:00Z').toISOString(), updatedAt: new Date('2023-10-20T07:00:00Z').toISOString(), isFavorite: false },
  { id: '8', title: 'Call Mom', content: 'Ask about her doctor appointment. Remind her about dinner next week.', category: 'Personal', priority: 'High', createdAt: new Date('2023-10-19T14:00:00Z').toISOString(), updatedAt: new Date('2023-10-19T14:00:00Z').toISOString(), isFavorite: true },
  { id: '9', title: 'Learning React Native', content: 'Focus on Hooks, Navigation, State Management. Build a small project.', category: 'Learning', priority: 'Medium', createdAt: new Date('2023-10-18T11:00:00Z').toISOString(), updatedAt: new Date('2023-10-18T11:00:00Z').toISOString(), isFavorite: false },
  { id: '10', title: 'Car Maintenance Checklist', content: 'Oil change, tire rotation, brake check, fluid levels. Schedule appointment for next month.', category: 'Personal', priority: 'Low', createdAt: new Date('2023-10-17T16:00:00Z').toISOString(), updatedAt: new Date('2023-10-17T16:00:00Z').toISOString(), isFavorite: false },
  { id: '11', title: 'Budget Planning', content: 'Review monthly expenses, allocate funds for savings, entertainment, and bills. Cut unnecessary subscriptions.', category: 'Finance', priority: 'High', createdAt: new Date('2023-10-16T09:00:00Z').toISOString(), updatedAt: new Date('2023-10-16T09:00:00Z').toISOString(), isFavorite: true },
  { id: '12', title: 'Gift Ideas for Sarah', content: 'Scarf, personalized mug, gift card to her favorite coffee shop, novel by her favorite author.', category: 'Personal', priority: 'Medium', createdAt: new Date('2023-10-15T13:00:00Z').toISOString(), updatedAt: new Date('2023-10-15T13:00:00Z').toISOString(), isFavorite: false },
  { id: '13', title: 'New Blog Post Topic', content: 'Top 5 Productivity Hacks for Remote Workers. Interview with industry expert.', category: 'Work', priority: 'High', createdAt: new Date('2023-10-14T10:00:00Z').toISOString(), updatedAt: new Date('2023-10-14T10:00:00Z').toISOString(), isFavorite: false },
  { id: '14', title: 'Garden Planting Plan', content: 'Tomatoes, basil, bell peppers, zucchini. Check soil pH. Plant in early spring.', category: 'Hobbies', priority: 'Low', createdAt: new Date('2023-10-13T17:00:00Z').toISOString(), updatedAt: new Date('2023-10-13T17:00:00Z').toISOString(), isFavorite: false },
  { id: '15', title: 'Dentist Appointment', content: 'Annual check-up and cleaning. Confirm time and date with reception.', category: 'Health', priority: 'High', createdAt: new Date('2023-10-12T08:30:00Z').toISOString(), updatedAt: new Date('2023-10-12T08:30:00Z').toISOString(), isFavorite: false, location: { latitude: 37.7949, longitude: -122.4394, name: 'Dental Clinic' } },
  { id: '16', title: 'Movie Night Ideas', content: 'Comedy: Superbad. Action: John Wick. Sci-Fi: Arrival. Horror: The Conjuring.', category: 'Entertainment', priority: 'Low', createdAt: new Date('2023-10-11T20:00:00Z').toISOString(), updatedAt: new Date('2023-10-11T20:00:00Z').toISOString(), isFavorite: true },
  { id: '17', title: 'Research Paper Outline', content: 'Introduction, Literature Review, Methodology, Results, Discussion, Conclusion. Topic: AI Ethics.', category: 'Learning', priority: 'High', createdAt: new Date('2023-10-10T11:30:00Z').toISOString(), updatedAt: new Date('2023-10-10T11:30:00Z').toISOString(), isFavorite: false },
  { id: '18', title: 'Holiday Planning', content: 'Destination: Japan. Dates: December 1-15. Budget: $3000. Activities: Kyoto temples, Tokyo food tour.', category: 'Travel', priority: 'Medium', createdAt: new Date('2023-10-09T14:00:00Z').toISOString(), updatedAt: new Date('2023-10-09T14:00:00Z').toISOString(), isFavorite: false, location: { latitude: 35.6895, longitude: 139.6917, name: 'Tokyo' } }
];

const NOTE_CATEGORIES = ['All', 'Work', 'Personal', 'Travel', 'Books', 'Cooking', 'Health', 'Learning', 'Finance', 'Hobbies', 'Entertainment'];
const NOTE_PRIORITIES = ['All', 'High', 'Medium', 'Low'];

//  UTILITY FUNCTIONS 
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatTextPreview = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const debounce = (func, delay) => {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

//  REUSABLE COMPONENTS 

const CustomHeader = ({ title, onBackPress, rightIcon, onRightIconPress }) => (
  <View style={headerStyles.container}>
    {onBackPress && (
      <TouchableOpacity onPress={onBackPress} style={headerStyles.leftButton}>
        <Text style={headerStyles.backIcon}>{'< '}</Text>
      </TouchableOpacity>
    )}
    <Text style={headerStyles.title}>{title}</Text>
    {rightIcon && (
      <TouchableOpacity onPress={onRightIconPress} style={headerStyles.rightButton}>
        <Text style={headerStyles.rightIcon}>{rightIcon}</Text>
      </TouchableOpacity>
    )}
    {!onBackPress && !rightIcon && <View style={headerStyles.placeholder} />}
    {onBackPress && !rightIcon && <View style={headerStyles.placeholder} />}
    {!onBackPress && rightIcon && <View style={headerStyles.placeholder} />}
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    backgroundColor: COLORS.elevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center'
  },
  leftButton: {
    padding: SPACING.small
  },
  rightButton: {
    padding: SPACING.small
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.accent
  },
  rightIcon: {
    fontSize: 24,
    color: COLORS.accent
  },
  placeholder: {
    width: 40, // To balance the title
  }
});

const CustomButton = ({ title, onPress, style, textStyle, variant = 'primary', icon }) => {
  const buttonColor = variant === 'primary' ? COLORS.accent : variant === 'danger' ? COLORS.danger : variant === 'secondary' ? COLORS.secondary : COLORS.muted;
  const textColor = variant === 'primary' ? COLORS.background : COLORS.text;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        buttonStyles.button,
        { backgroundColor: buttonColor },
        variant === 'secondary' && { borderWidth: 1, borderColor: COLORS.secondary },
        style
      ]}
    >
      {icon && <Text style={[buttonStyles.icon, { color: textColor }]}>{icon}</Text>}
      <Text style={[buttonStyles.text, { color: textColor }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  text: {
    fontSize: 16,
    fontWeight: '600'
  },
  icon: {
    fontSize: 18,
    marginRight: SPACING.small / 2
  }
});

const TextInputField = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', style, error }) => (
  <View style={inputStyles.container}>
    {label && <Text style={inputStyles.label}>{label}</Text>}
    <TextInput
      style={[inputStyles.input, multiline && inputStyles.multiline, style, error && inputStyles.inputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.muted}
      multiline={multiline}
      keyboardType={keyboardType}
    />
    {error && <Text style={inputStyles.errorText}>{error}</Text>}
  </View>
);

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.medium
  },
  label: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: SPACING.small / 2,
    fontWeight: '500'
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small + 2,
    borderRadius: BORDER_RADIUS.input,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.surface
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.small
  },
  inputError: {
    borderColor: COLORS.danger
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: SPACING.small / 2
  }
});

const NoteCard = ({ note, onPress, onToggleFavorite, showCategory = true }) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(note);
    }}
    style={noteCardStyles.card}
  >
    <View style={noteCardStyles.header}>
      <Text style={noteCardStyles.title}>{note.title}</Text>
      <TouchableOpacity onPress={() => { Haptics.lightAsync(); onToggleFavorite(note.id); }}>
        <Text style={noteCardStyles.favoriteIcon}>{note.isFavorite ? '\u2764' : '\u2661'}</Text>
      </TouchableOpacity>
    </View>
    <Text style={noteCardStyles.contentPreview}>{formatTextPreview(note.content, 100)}</Text>
    <View style={noteCardStyles.footer}>
      {showCategory && <Text style={noteCardStyles.category}>#{note.category}</Text>}
      <Text style={[noteCardStyles.priority, { backgroundColor: getPriorityColor(note.priority) }]}>{note.priority}</Text>
      <Text style={noteCardStyles.date}>{getTimeAgo(note.updatedAt)}</Text>
    </View>
  </TouchableOpacity>
);

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return COLORS.danger;
    case 'Medium': return COLORS.warning;
    case 'Low': return COLORS.success;
    default: return COLORS.muted;
  }
};

const noteCardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    ...SHADOWS.card
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.small
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flexShrink: 1,
    marginRight: SPACING.small
  },
  favoriteIcon: {
    fontSize: 22,
    color: COLORS.danger
  },
  contentPreview: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: SPACING.small
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap'
  },
  category: {
    backgroundColor: COLORS.elevated,
    color: COLORS.accent,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.small / 2,
    borderRadius: BORDER_RADIUS.chip,
    fontSize: 12,
    marginRight: SPACING.small,
    fontWeight: '500'
  },
  priority: {
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.small / 2,
    borderRadius: BORDER_RADIUS.chip,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    marginRight: SPACING.small
  },
  date: {
    fontSize: 12,
    color: COLORS.muted
  }
});

const SearchBar = ({ searchTerm, onSearchChange, onClearSearch }) => (
  <View style={searchBarStyles.container}>
    <TextInput
      style={searchBarStyles.input}
      placeholder="Search notes..."
      placeholderTextColor={COLORS.muted}
      value={searchTerm}
      onChangeText={onSearchChange}
    />
    {searchTerm.length > 0 && (
      <TouchableOpacity onPress={onClearSearch} style={searchBarStyles.clearButton}>
        <Text style={searchBarStyles.clearIcon}>{' \u274C'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const searchBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.input,
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.medium,
    paddingHorizontal: SPACING.small
  },
  input: {
    flex: 1,
    height: 40,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: SPACING.small
  },
  clearButton: {
    padding: SPACING.small
  },
  clearIcon: {
    color: COLORS.muted,
    fontSize: 18
  }
});

const FilterChip = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(label);
    }}
    style={[
      filterChipStyles.chip,
      isSelected ? filterChipStyles.selectedChip : filterChipStyles.unselectedChip
    ]}
  >
    <Text style={[
      filterChipStyles.chipText,
      isSelected ? filterChipStyles.selectedChipText : filterChipStyles.unselectedChipText
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const filterChipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.chip,
    marginRight: SPACING.small
  },
  selectedChip: {
    backgroundColor: COLORS.accent
  },
  unselectedChip: {
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.surface
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600'
  },
  selectedChipText: {
    color: COLORS.background
  },
  unselectedChipText: {
    color: COLORS.secondary
  }
});

const EmptyState = ({ icon, message, ctaText, onCtaPress }) => (
  <View style={emptyStateStyles.container}>
    <Text style={emptyStateStyles.icon}>{icon}</Text>
    <Text style={emptyStateStyles.message}>{message}</Text>
    {ctaText && onCtaPress && (
      <CustomButton title={ctaText} onPress={onCtaPress} style={emptyStateStyles.ctaButton} />
    )}
  </View>
);

const emptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.large
  },
  icon: {
    fontSize: 60,
    marginBottom: SPACING.medium,
    color: COLORS.muted
  },
  message: {
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.large
  },
  ctaButton: {
    marginTop: SPACING.medium
  }
});

const Toast = ({ message, type, isVisible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current; // Start 50 units below

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 50, duration: 300, useNativeDriver: true })
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible && fadeAnim._value === 0) return null; // Avoid rendering when fully hidden

  const backgroundColor =
    type === 'success' ? COLORS.success :
      type === 'error' ? COLORS.danger :
        COLORS.secondary;

  const icon =
    type === 'success' ? '\u2705' :
      type === 'error' ? '\u274C' :
        '\u{1F514}';

  return (
    <Animated.View style={[
      toastStyles.container,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        backgroundColor: backgroundColor
      }
    ]}>
      <Text style={toastStyles.icon}>{icon}</Text>
      <Text style={toastStyles.message}>{message}</Text>
    </Animated.View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: SPACING.xl * 2,
    left: SPACING.medium,
    right: SPACING.medium,
    borderRadius: BORDER_RADIUS.button,
    padding: SPACING.small,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.card
  },
  icon: {
    fontSize: 20,
    marginRight: SPACING.small
  },
  message: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1
  }
});

const LoadingOverlay = ({ isVisible, message = 'Loading...' }) => {
  if (!isVisible) return null;
  return (
    <View style={loadingStyles.overlay}>
      <View style={loadingStyles.content}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={loadingStyles.message}>{message}</Text>
      </View>
    </View>
  );
};

const loadingStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  content: {
    backgroundColor: COLORS.elevated,
    padding: SPACING.large,
    borderRadius: BORDER_RADIUS.card,
    alignItems: 'center',
    ...SHADOWS.card
  },
  message: {
    marginTop: SPACING.medium,
    color: COLORS.text,
    fontSize: 16
  }
});

//  SCREEN COMPONENTS 

const HomeScreen = ({ notes, onNotePress, showToast }) => {
  const recentNotes = useMemo(() => {
    return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  }, [notes]);

  const favoritedNotes = useMemo(() => notes.filter(n => n.isFavorite).length, [notes]);
  const totalNotes = notes.length;

  const categoryCounts = useMemo(() => {
    return notes.reduce((acc, note) => {
      acc[note.category] = (acc[note.category] || 0) + 1;
      return acc;
    }, {});
  }, [notes]);

  const topCategories = useMemo(() => {
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3);
    const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    return sortedCategories.map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }, [categoryCounts]);

  const notesWithLocation = useMemo(() => {
    return notes.filter(n => n.location && n.location.latitude && n.location.longitude);
  }, [notes]);

  const initialRegion = useMemo(() => {
    if (notesWithLocation.length === 0) {
      // Default to a central location if no notes have locations
      return {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      };
    }
    // Calculate average location for notes with location
    const avgLat = notesWithLocation.reduce((sum, n) => sum + n.location.latitude, 0) / notesWithLocation.length;
    const avgLon = notesWithLocation.reduce((sum, n) => sum + n.location.longitude, 0) / notesWithLocation.length;

    return {
      latitude: avgLat,
      longitude: avgLon,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    };
  }, [notesWithLocation]);

  return (
    <ScrollView style={homeStyles.container} contentContainerStyle={homeStyles.contentContainer}>
      <StatusBar style="light" />
      <CustomHeader title="Dashboard" />

      {/* Stats Overview */}
      <View style={homeStyles.statsContainer}>
        <View style={homeStyles.statCard}>
          <Text style={homeStyles.statIcon}>{'\u{1F4CB}'}</Text>
          <Text style={homeStyles.statValue}>{totalNotes}</Text>
          <Text style={homeStyles.statLabel}>Total Notes</Text>
        </View>
        <View style={homeStyles.statCard}>
          <Text style={homeStyles.statIcon}>{'\u2764'}</Text>
          <Text style={homeStyles.statValue}>{favoritedNotes}</Text>
          <Text style={homeStyles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Categories Breakdown */}
      {totalNotes > 0 && (
        <View style={homeStyles.sectionCard}>
          <Text style={homeStyles.sectionTitle}>Categories Breakdown</Text>
          {topCategories.map((data, index) => (
            <View key={index} style={homeStyles.progressBarContainer}>
              <Text style={homeStyles.progressLabel}>{data.category}</Text>
              <View style={homeStyles.progressBarBackground}>
                <View style={[homeStyles.progressBarFill, { width: `${data.percentage}%` }]} />
              </View>
              <Text style={homeStyles.progressText}>{data.count} ({data.percentage.toFixed(0)}%)</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <View style={homeStyles.sectionContainer}>
          <Text style={homeStyles.sectionTitle}>Recently Updated</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={homeStyles.recentNotesScroll}>
            {recentNotes.map((note) => (
              <TouchableOpacity key={note.id} style={homeStyles.recentNoteCard} onPress={() => onNotePress(note)}>
                <Text style={homeStyles.recentNoteTitle}>{formatTextPreview(note.title, 30)}</Text>
                <Text style={homeStyles.recentNoteContent}>{formatTextPreview(note.content, 60)}</Text>
                <Text style={homeStyles.recentNoteDate}>{getTimeAgo(note.updatedAt)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Notes with Location Map */}
      {notesWithLocation.length > 0 && (
        <View style={homeStyles.sectionCard}>
          <Text style={homeStyles.sectionTitle}>Notes Near Me</Text>
          <MapView
            style={homeStyles.map}
            initialRegion={initialRegion}
            provider="google"
          >
            {notesWithLocation.map((note) => (
              <Marker
                key={note.id}
                coordinate={{ latitude: note.location.latitude, longitude: note.location.longitude }}
                title={note.title}
                description={note.location.name}
                onPress={() => onNotePress(note)}
              >
                <View style={homeStyles.markerContainer}>
                  <Text style={homeStyles.markerText}>{'\u{1F4CD}'}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          <Text style={homeStyles.mapHint}>Tap a marker to view note details.</Text>
        </View>
      )}

      {totalNotes === 0 && (
        <EmptyState
          icon={'\u{1F4DD}'}
          message="No notes yet! Start by adding your first note."
          ctaText="Add New Note"
          onCtaPress={() => showToast('Navigating to Add Note', 'info')} // This would typically navigate to Add tab
        />
      )}
    </ScrollView>
  );
};

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  contentContainer: {
    paddingBottom: SPACING.xl * 2
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.medium
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    alignItems: 'center',
    width: (width / 2) - SPACING.large,
    ...SHADOWS.card
  },
  statIcon: {
    fontSize: 30,
    color: COLORS.accent,
    marginBottom: SPACING.small
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: SPACING.small / 2
  },
  sectionContainer: {
    marginTop: SPACING.medium,
    paddingLeft: SPACING.medium
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    marginHorizontal: SPACING.medium,
    marginTop: SPACING.medium,
    padding: SPACING.medium,
    ...SHADOWS.card
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.medium
  },
  recentNotesScroll: {
    paddingRight: SPACING.medium, // Add padding for the last item
  },
  recentNoteCard: {
    backgroundColor: COLORS.elevated,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.medium,
    marginRight: SPACING.medium,
    width: width * 0.7,
    ...SHADOWS.card
  },
  recentNoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.small / 2
  },
  recentNoteContent: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: SPACING.small
  },
  recentNoteDate: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'right'
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small
  },
  progressLabel: {
    color: COLORS.secondary,
    fontSize: 13,
    width: 80
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.muted + '44',
    borderRadius: 4,
    marginHorizontal: SPACING.small,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4
  },
  progressText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
    width: 60,
    textAlign: 'right'
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.input,
    overflow: 'hidden',
    marginBottom: SPACING.small
  },
  mapHint: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.small
  },
  markerContainer: {
    backgroundColor: COLORS.accent,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.text
  },
  markerText: {
    fontSize: 18,
    color: COLORS.background
  }
});

const NotesScreen = ({ notes, onNotePress, onToggleFavorite, onBackPress, showToast, setCurrentScreen }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt', 'title', 'priority'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useCallback(debounce((text) => setSearchTerm(text), 300), []);

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }
    if (selectedPriority !== 'All') {
      filtered = filtered.filter(note => note.priority === selectedPriority);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(lowerSearchTerm) ||
        note.content.toLowerCase().includes(lowerSearchTerm) ||
        note.category.toLowerCase().includes(lowerSearchTerm)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'updatedAt') {
        comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [notes, searchTerm, selectedCategory, selectedPriority, sortBy, sortOrder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      // In a real app, you would refetch data here
      setRefreshing(false);
      showToast('Notes refreshed!', 'success');
    }, 1500);
  }, [showToast]);

  const handleSortChange = useCallback((newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to desc for new sort
    }
  }, [sortBy, sortOrder]);

  const getSortIcon = useCallback((field) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? ' \u25B2' : ' \u25BC';
    }
    return '';
  }, [sortBy, sortOrder]);

  return (
    <SafeAreaView style={notesStyles.container}>
      <StatusBar style="light" />
      <CustomHeader title="My Notes" onBackPress={onBackPress} rightIcon={'\u2795'} onRightIconPress={() => setCurrentScreen('AddNote')} />

      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={debouncedSearch}
        onClearSearch={() => setSearchTerm('')}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={notesStyles.filtersScroll}>
        <FilterChip label="All" isSelected={selectedCategory === 'All'} onPress={() => setSelectedCategory('All')} />
        {NOTE_CATEGORIES.filter(cat => cat !== 'All').map(cat => (
          <FilterChip key={cat} label={cat} isSelected={selectedCategory === cat} onPress={() => setSelectedCategory(cat)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={notesStyles.filtersScroll}>
        <FilterChip label="All" isSelected={selectedPriority === 'All'} onPress={() => setSelectedPriority('All')} />
        {NOTE_PRIORITIES.filter(p => p !== 'All').map(p => (
          <FilterChip key={p} label={p} isSelected={selectedPriority === p} onPress={() => setSelectedPriority(p)} />
        ))}
      </ScrollView>

      <View style={notesStyles.sortContainer}>
        <Text style={notesStyles.sortLabel}>Sort by:</Text>
        <TouchableOpacity style={notesStyles.sortOption} onPress={() => handleSortChange('updatedAt')}>
          <Text style={notesStyles.sortText}>Date{getSortIcon('updatedAt')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={notesStyles.sortOption} onPress={() => handleSortChange('title')}>
          <Text style={notesStyles.sortText}>Title{getSortIcon('title')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={notesStyles.sortOption} onPress={() => handleSortChange('priority')}>
          <Text style={notesStyles.sortText}>Priority{getSortIcon('priority')}</Text>
        </TouchableOpacity>
      </View>

      {filteredAndSortedNotes.length === 0 ? (
        <EmptyState
          icon={'\u{1F50D}'}
          message="No notes found matching your criteria. Try adjusting filters or search term."
          ctaText="Clear Filters"
          onCtaPress={() => {
            setSearchTerm('');
            setSelectedCategory('All');
            setSelectedPriority('All');
          }}
        />
      ) : (
        <FlatList
          data={filteredAndSortedNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={onNotePress}
              onToggleFavorite={onToggleFavorite}
            />
          )}
          contentContainerStyle={notesStyles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
    </SafeAreaView>
  );
};

const notesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  filtersScroll: {
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.medium
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.medium
  },
  sortLabel: {
    color: COLORS.secondary,
    fontSize: 14,
    marginRight: SPACING.small
  },
  sortOption: {
    backgroundColor: COLORS.elevated,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.small / 2,
    borderRadius: BORDER_RADIUS.chip,
    marginRight: SPACING.small,
    flexDirection: 'row',
    alignItems: 'center'
  },
  sortText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500'
  },
  listContent: {
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.xl * 2, // Ensure space for tab bar
  }
});

const NoteDetailScreen = ({ note, onBackPress, onDeleteNote, onUpdateNote, showToast }) => {
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  if (!note) {
    return (
      <SafeAreaView style={detailStyles.container}>
        <CustomHeader title="Note Details" onBackPress={onBackPress} />
        <EmptyState icon={'\u{1F4A4}'} message="Note not found." />
      </SafeAreaView>
    );
  }

  const handleShare = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, you'd use Sharing.shareAsync or similar
    Alert.alert(
      'Share Note',
      `Sharing "${note.title}" via: \n\n${note.content}`,
      [{ text: 'OK' }]
    );
    showToast('Note shared (simulated)!', 'info');
  }, [note, showToast]);

  const handleToggleFavorite = useCallback(() => {
    onUpdateNote({ ...note, isFavorite: !note.isFavorite }, 'favorite');
  }, [note, onUpdateNote]);

  const handleDelete = useCallback(() => {
    setConfirmModalVisible(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onDeleteNote(note.id);
    setConfirmModalVisible(false);
    showToast('Note deleted!', 'success');
  }, [note, onDeleteNote, showToast]);

  return (
    <SafeAreaView style={detailStyles.container}>
      <StatusBar style="light" />
      <CustomHeader
        title="Note Details"
        onBackPress={onBackPress}
        rightIcon={'\u270F'} // Edit icon
        onRightIconPress={() => onBackPress({ screen: 'AddNote', params: { noteId: note.id } })}
      />

      <ScrollView contentContainerStyle={detailStyles.scrollContent}>
        <View style={detailStyles.card}>
          <Text style={detailStyles.title}>{note.title}</Text>
          <Text style={detailStyles.content}>{note.content}</Text>

          <View style={detailStyles.infoRow}>
            <Text style={detailStyles.infoLabel}>Category:</Text>
            <Text style={detailStyles.infoValue}>#{note.category}</Text>
          </View>
          <View style={detailStyles.infoRow}>
            <Text style={detailStyles.infoLabel}>Priority:</Text>
            <Text style={[detailStyles.priorityBadge, { backgroundColor: getPriorityColor(note.priority) }]}>{note.priority}</Text>
          </View>
          <View style={detailStyles.infoRow}>
            <Text style={detailStyles.infoLabel}>Created:</Text>
            <Text style={detailStyles.infoValue}>{formatDate(note.createdAt)}</Text>
          </View>
          <View style={detailStyles.infoRow}>
            <Text style={detailStyles.infoLabel}>Last Updated:</Text>
            <Text style={detailStyles.infoValue}>{formatDate(note.updatedAt)} ({getTimeAgo(note.updatedAt)})</Text>
          </View>
          {note.location && (
            <View style={detailStyles.infoRow}>
              <Text style={detailStyles.infoLabel}>Location:</Text>
              <Text style={detailStyles.infoValue}>{note.location.name} {'\u{1F4CD}'}</Text>
            </View>
          )}

          <View style={detailStyles.actionButtons}>
            <CustomButton
              title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
              icon={note.isFavorite ? '\u2764' : '\u2661'}
              onPress={handleToggleFavorite}
              style={detailStyles.actionButton}
              variant="secondary"
            />
            <CustomButton
              title="Share"
              icon={'\u{1F4E4}'}
              onPress={handleShare}
              style={detailStyles.actionButton}
              variant="secondary"
            />
            <CustomButton
              title="Delete"
              icon={'\u{1F5D1}'}
              onPress={handleDelete}
              style={detailStyles.actionButton}
              variant="danger"
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={detailStyles.centeredView}>
          <View style={detailStyles.modalView}>
            <Text style={detailStyles.modalTitle}>Confirm Deletion</Text>
            <Text style={detailStyles.modalText}>Are you sure you want to delete this note?</Text>
            <View style={detailStyles.modalButtonContainer}>
              <CustomButton title="Cancel" onPress={() => setConfirmModalVisible(false)} variant="secondary" style={{ flex: 1, marginRight: SPACING.small }} />
              <CustomButton title="Delete" onPress={confirmDelete} variant="danger" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: SPACING.medium,
    paddingBottom: SPACING.xl * 2
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.large,
    ...SHADOWS.card
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.medium
  },
  content: {
    fontSize: 16,
    color: COLORS.secondary,
    lineHeight: 24,
    marginBottom: SPACING.large
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.small
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.secondary,
    flexShrink: 1
  },
  priorityBadge: {
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.small / 2,
    borderRadius: BORDER_RADIUS.chip,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600'
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: SPACING.large,
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
    marginVertical: SPACING.small / 2,
    marginHorizontal: SPACING.small / 2
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    backgroundColor: COLORS.elevated,
    borderRadius: BORDER_RADIUS.modal,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
    width: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.small
  },
  modalText: {
    marginBottom: SPACING.large,
    textAlign: 'center',
    color: COLORS.secondary,
    fontSize: 16
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  }
});

const NoteFormScreen = ({ onBackPress, onSaveNote, editingNote, showToast }) => {
  const [title, setTitle] = useState(editingNote ? editingNote.title : '');
  const [content, setContent] = useState(editingNote ? editingNote.content : '');
  const [category, setCategory] = useState(editingNote ? editingNote.category : NOTE_CATEGORIES[1]);
  const [priority, setPriority] = useState(editingNote ? editingNote.priority : NOTE_PRIORITIES[1]);
  const [locationEnabled, setLocationEnabled] = useState(!!editingNote?.location);
  const [currentLocation, setCurrentLocation] = useState(editingNote?.location || null);
  const [locationName, setLocationName] = useState(editingNote?.location?.name || '');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setCategory(editingNote.category);
      setPriority(editingNote.priority);
      setLocationEnabled(!!editingNote.location);
      setCurrentLocation(editingNote.location || null);
      setLocationName(editingNote.location?.name || '');
    } else {
      setTitle('');
      setContent('');
      setCategory(NOTE_CATEGORIES[1]);
      setPriority(NOTE_PRIORITIES[1]);
      setLocationEnabled(false);
      setCurrentLocation(null);
      setLocationName('');
    }
  }, [editingNote]);

  const handleGetLocation = useCallback(async () => {
    setLoadingLocation(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied.');
      setLoadingLocation(false);
      showToast('Location permission denied!', 'error');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      let address = await Location.reverseGeocodeAsync({ latitude, longitude });
      const name = address[0] ? `${address[0].name}, ${address[0].city}` : 'Unknown Location';
      setCurrentLocation({ latitude, longitude, name });
      setLocationName(name);
      showToast('Location captured!', 'success');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get current location.');
      showToast('Error getting location!', 'error');
    } finally {
      setLoadingLocation(false);
    }
  }, [showToast]);

  const handleSave = useCallback(() => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Title is required.');
      valid = false;
    } else {
      setTitleError('');
    }
    if (!content.trim()) {
      setContentError('Content cannot be empty.');
      valid = false;
    } else {
      setContentError('');
    }

    if (!valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Please fill all required fields.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const newNote = {
      id: editingNote ? editingNote.id : generateId(),
      title,
      content,
      category,
      priority,
      createdAt: editingNote ? editingNote.createdAt : now,
      updatedAt: now,
      isFavorite: editingNote ? editingNote.isFavorite : false,
      location: locationEnabled ? (currentLocation || { name: locationName || 'Manual Location', latitude: 0, longitude: 0 }) : null
    };
    onSaveNote(newNote);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(editingNote ? 'Note updated!' : 'Note added!', 'success');
  }, [title, content, category, priority, locationEnabled, currentLocation, locationName, editingNote, onSaveNote, showToast]);

  return (
    <SafeAreaView style={formStyles.container}>
      <StatusBar style="light" />
      <CustomHeader
        title={editingNote ? 'Edit Note' : 'Add New Note'}
        onBackPress={onBackPress}
      />

      <ScrollView contentContainerStyle={formStyles.scrollContent}>
        <TextInputField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Meeting Notes, Grocery List"
          error={titleError}
        />
        <TextInputField
          label="Content"
          value={content}
          onChangeText={setContent}
          placeholder="Write your note here..."
          multiline
          error={contentError}
        />

        <View style={formStyles.fieldRow}>
          <Text style={inputStyles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={formStyles.chipsScroll}>
            {NOTE_CATEGORIES.filter(cat => cat !== 'All').map(cat => (
              <FilterChip key={cat} label={cat} isSelected={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </ScrollView>
        </View>

        <View style={formStyles.fieldRow}>
          <Text style={inputStyles.label}>Priority</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={formStyles.chipsScroll}>
            {NOTE_PRIORITIES.filter(p => p !== 'All').map(p => (
              <FilterChip key={p} label={p} isSelected={priority === p} onPress={() => setPriority(p)} />
            ))}
          </ScrollView>
        </View>

        <View style={formStyles.switchRow}>
          <Text style={inputStyles.label}>Add Location</Text>
          <Switch
            trackColor={{ false: COLORS.muted, true: COLORS.accent }}
            thumbColor={COLORS.text}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLocationEnabled(value);
              if (!value) {
                setCurrentLocation(null);
                setLocationName('');
              }
            }}
            value={locationEnabled}
          />
        </View>

        {locationEnabled && (
          <View style={formStyles.locationContainer}>
            <TextInputField
              label="Location Name (Optional)"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g., Office, Home, Park"
              style={formStyles.locationNameInput}
            />
            <CustomButton
              title={currentLocation ? 'Update Current Location' : 'Get Current Location'}
              icon={'\u{1F4CD}'}
              onPress={handleGetLocation}
              style={formStyles.locationButton}
              variant="secondary"
            />
            {loadingLocation && <ActivityIndicator size="small" color={COLORS.accent} style={formStyles.locationLoading} />}
            {currentLocation && !loadingLocation && (
              <Text style={formStyles.locationText}>
                {currentLocation.name} ({currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)})
              </Text>
            )}
            {currentLocation && (
              <MapView
                style={formStyles.mapPreview}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }} />
              </MapView>
            )}
          </View>
        )}

        <CustomButton
          title={editingNote ? 'Save Changes' : 'Add Note'}
          onPress={handleSave}
          style={formStyles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: SPACING.medium,
    paddingBottom: SPACING.xl * 2
  },
  fieldRow: {
    marginBottom: SPACING.medium
  },
  chipsScroll: {
    marginTop: SPACING.small / 2,
    paddingVertical: SPACING.small / 2
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.input,
    marginBottom: SPACING.medium,
    ...SHADOWS.card
  },
  locationContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.input,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    ...SHADOWS.card
  },
  locationNameInput: {
    marginBottom: SPACING.medium
  },
  locationButton: {
    marginBottom: SPACING.medium
  },
  locationLoading: {
    marginBottom: SPACING.small
  },
  locationText: {
    color: COLORS.secondary,
    fontSize: 14,
    marginBottom: SPACING.medium,
    textAlign: 'center'
  },
  mapPreview: {
    width: '100%',
    height: 150,
    borderRadius: BORDER_RADIUS.input,
    overflow: 'hidden',
    marginTop: SPACING.small
  },
  saveButton: {
    marginTop: SPACING.large
  }
});

const FavoritesScreen = ({ notes, onNotePress, onToggleFavorite }) => {
  const favoritedNotes = useMemo(() => notes.filter(n => n.isFavorite), [notes]);

  return (
    <SafeAreaView style={notesStyles.container}>
      <StatusBar style="light" />
      <CustomHeader title="Favorites" />

      {favoritedNotes.length === 0 ? (
        <EmptyState
          icon={'\u2764'}
          message="You haven't favorited any notes yet. Tap the heart icon on a note to add it here!"
        />
      ) : (
        <FlatList
          data={favoritedNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={onNotePress}
              onToggleFavorite={onToggleFavorite}
              showCategory={true}
            />
          )}
          contentContainerStyle={notesStyles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const ProfileScreen = ({ settings, onUpdateSetting, showToast }) => {
  const handleShareApp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Share Notepad App',
      'Help us grow! Share this app with your friends.',
      [{ text: 'OK' }]
    );
    showToast('App share initiated (simulated)!', 'info');
  }, [showToast]);

  const handleRateApp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Rate Us',
      'Enjoying the app? Please take a moment to rate us on the Play Store!',
      [{ text: 'Later' }, { text: 'Rate Now', onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.yourapp.id') }]
    );
  }, []);

  return (
    <SafeAreaView style={profileStyles.container}>
      <StatusBar style="light" />
      <CustomHeader title="Profile & Settings" />

      <ScrollView contentContainerStyle={profileStyles.scrollContent}>
        {/* User Info Section (Mock) */}
        <View style={profileStyles.sectionCard}>
          <View style={profileStyles.profileHeader}>
            <View style={profileStyles.avatar}>
              <Text style={profileStyles.avatarText}>{'\u{1F464}'}</Text>
            </View>
            <Text style={profileStyles.userName}>John Doe</Text>
            <Text style={profileStyles.userEmail}>john.doe@example.com</Text>
          </View>
        </View>

        {/* General Settings */}
        <View style={profileStyles.sectionCard}>
          <Text style={profileStyles.sectionTitle}>General Settings</Text>
          <View style={profileStyles.settingItem}>
            <Text style={profileStyles.settingLabel}>Enable Haptic Feedback</Text>
            <Switch
              trackColor={{ false: COLORS.muted, true: COLORS.accent }}
              thumbColor={COLORS.text}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onUpdateSetting('hapticFeedback', value);
                showToast(`Haptic feedback ${value ? 'enabled' : 'disabled'}`, 'info');
              }}
              value={settings.hapticFeedback}
            />
          </View>
          <View style={profileStyles.settingItem}>
            <Text style={profileStyles.settingLabel}>Notifications</Text>
            <Switch
              trackColor={{ false: COLORS.muted, true: COLORS.accent }}
              thumbColor={COLORS.text}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onUpdateSetting('notifications', value);
                showToast(`Notifications ${value ? 'enabled' : 'disabled'}`, 'info');
              }}
              value={settings.notifications}
            />
          </View>
        </View>

        {/* About & Support */}
        <View style={profileStyles.sectionCard}>
          <Text style={profileStyles.sectionTitle}>About & Support</Text>
          <TouchableOpacity style={profileStyles.aboutItem} onPress={handleShareApp}>
            <Text style={profileStyles.aboutText}>Share App {'\u{1F4E4}'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.aboutItem} onPress={handleRateApp}>
            <Text style={profileStyles.aboutText}>Rate Us {'\u2B50'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.aboutItem} onPress={() => Alert.alert('Help', 'Contact support at support@notepad.com')}>
            <Text style={profileStyles.aboutText}>Help & Feedback {'\u{1F4AC}'}</Text>
          </TouchableOpacity>
          <View style={profileStyles.aboutItem}>
            <Text style={profileStyles.aboutText}>App Version</Text>
            <Text style={profileStyles.aboutValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    padding: SPACING.medium,
    paddingBottom: SPACING.xl * 2
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.large,
    marginBottom: SPACING.medium,
    ...SHADOWS.card
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.medium
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent + '44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.small
  },
  avatarText: {
    fontSize: 40,
    color: COLORS.accent
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.small / 2
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.secondary
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.medium
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.elevated
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.elevated
  },
  aboutText: {
    fontSize: 16,
    color: COLORS.text
  },
  aboutValue: {
    fontSize: 16,
    color: COLORS.secondary
  }
});

const CustomTabBar = ({ activeTab, onTabPress, notificationCounts }) => {
  const tabs = useMemo(() => [
    { name: 'home', icon: '\u{1F3E0}', label: 'Home' },
    { name: 'notes', icon: '\u{1F4DD}', label: 'Notes' },
    { name: 'add', icon: '\u2795', label: 'Add' },
    { name: 'favorites', icon: '\u2764', label: 'Favorites', badge: notificationCounts.favorites },
    { name: 'profile', icon: '\u{1F464}', label: 'Profile' }
  ], [notificationCounts.favorites]);

  return (
    <LinearGradient
      colors={[COLORS.elevated, COLORS.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={tabBarStyles.container}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={tabBarStyles.tabButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onTabPress(tab.name);
          }}
        >
          <Text style={[tabBarStyles.tabIcon, { color: activeTab === tab.name ? COLORS.accent : COLORS.muted }]}>{tab.icon}</Text>
          <Text style={[tabBarStyles.tabLabel, { color: activeTab === tab.name ? COLORS.accent : COLORS.muted }]}>{tab.label}</Text>
          {tab.badge > 0 && (
            <View style={tabBarStyles.badge}>
              <Text style={tabBarStyles.badgeText}>{tab.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </LinearGradient>
  );
};

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 90 : 60,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? SPACING.medium : 0
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.small
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600'
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 15,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold'
  }
});

//  MAIN APP 
const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState(null); // null, 'NoteDetail', 'AddNote'
  const [screenParams, setScreenParams] = useState(null); // { noteId: '...', screen: '...' }
  const [notes, setNotes] = useState([]);
  const [settings, setSettings] = useState({
    hapticFeedback: true,
    notifications: true
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const loadAppData = useCallback(async () => {
    setLoading(true);
    try {
      const storedNotes = await AsyncStorage.getItem('notes');
      const storedSettings = await AsyncStorage.getItem('settings');
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      else setNotes(SAMPLE_NOTES); // Load sample data if no notes found

      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch (e) {
      console.error('Failed to load app data', e);
      showToast('Failed to load data!', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  useEffect(() => {
    if (notes.length > 0) {
      AsyncStorage.setItem('notes', JSON.stringify(notes)).catch(e => console.error('Failed to save notes', e));
    }
  }, [notes]);

  useEffect(() => {
    AsyncStorage.setItem('settings', JSON.stringify(settings)).catch(e => console.error('Failed to save settings', e));
  }, [settings]);

  const handleUpdateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveNote = useCallback((noteToSave) => {
    setNotes(prevNotes => {
      const existingIndex = prevNotes.findIndex(n => n.id === noteToSave.id);
      if (existingIndex > -1) {
        const updatedNotes = [...prevNotes];
        updatedNotes[existingIndex] = noteToSave;
        return updatedNotes;
      }
      return [noteToSave, ...prevNotes];
    });
    setCurrentScreen(null); // Go back to main list after saving
    setScreenParams(null);
  }, []);

  const handleDeleteNote = useCallback((noteId) => {
    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
    setCurrentScreen(null); // Go back to main list after deleting
    setScreenParams(null);
  }, []);

  const handleToggleFavorite = useCallback((noteId) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
      )
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Favorite status updated!', 'success');
  }, [showToast]);

  const handleNotePress = useCallback((note) => {
    setScreenParams({ noteId: note.id });
    setCurrentScreen('NoteDetail');
  }, []);

  const handleBackPress = useCallback((target = null) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: width, duration: 200, useNativeDriver: true })
    ]).start(() => {
      if (target && target.screen) {
        setCurrentScreen(target.screen);
        setScreenParams(target.params || null);
      } else {
        setCurrentScreen(null);
        setScreenParams(null);
      }
      // Reset animation values for next transition
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    });
  }, [fadeAnim, slideAnim]);

  const handleTabPress = useCallback((tabName) => {
    if (tabName === 'add') {
      setCurrentScreen('AddNote');
      setScreenParams(null);
    } else {
      setActiveTab(tabName);
      setCurrentScreen(null);
      setScreenParams(null);
    }
  }, []);

  const renderScreen = useCallback(() => {
    const selectedNote = screenParams && screenParams.noteId ? notes.find(n => n.id === screenParams.noteId) : null;

    if (currentScreen === 'NoteDetail') {
      return (
        <Animated.View style={[appStyles.screenAnimatedContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <NoteDetailScreen
            note={selectedNote}
            onBackPress={handleBackPress}
            onDeleteNote={handleDeleteNote}
            onUpdateNote={handleSaveNote}
            showToast={showToast}
          />
        </Animated.View>
      );
    }
    if (currentScreen === 'AddNote') {
      return (
        <Animated.View style={[appStyles.screenAnimatedContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <NoteFormScreen
            onBackPress={handleBackPress}
            onSaveNote={handleSaveNote}
            editingNote={selectedNote}
            showToast={showToast}
          />
        </Animated.View>
      );
    }

    switch (activeTab) {
      case 'home':
        return <HomeScreen notes={notes} onNotePress={handleNotePress} showToast={showToast} />;
      case 'notes':
        return <NotesScreen notes={notes} onNotePress={handleNotePress} onToggleFavorite={handleToggleFavorite} setCurrentScreen={setCurrentScreen} showToast={showToast} />;
      case 'favorites':
        return <FavoritesScreen notes={notes} onNotePress={handleNotePress} onToggleFavorite={handleToggleFavorite} />;
      case 'profile':
        return <ProfileScreen settings={settings} onUpdateSetting={handleUpdateSetting} showToast={showToast} />;
      default:
        return <HomeScreen notes={notes} onNotePress={handleNotePress} showToast={showToast} />;
    }
  }, [activeTab, currentScreen, screenParams, notes, settings, handleNotePress, handleToggleFavorite, handleSaveNote, handleDeleteNote, handleBackPress, handleUpdateSetting, fadeAnim, slideAnim, showToast]);

  const favoriteCount = useMemo(() => notes.filter(n => n.isFavorite).length, [notes]);

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading your notes..." />;
  }

  return (
    <View style={appStyles.container}>
      <StatusBar style="light" />
      <View style={appStyles.content}>
        {renderScreen()}
      </View>
      <CustomTabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        notificationCounts={{ favorites: favoriteCount }}
      />
      <Toast message={toastMessage} type={toastType} isVisible={toastVisible} />
    </View>
  );
};

const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 90 : 60, // Adjust for tab bar height
  },
  screenAnimatedContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background, // Ensure background matches
    zIndex: 1, // Make sure it's above the tab bar if sliding in
  }
});

export default App;