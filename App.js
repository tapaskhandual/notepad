import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, Modal, Alert, Animated, ScrollView, Image, Dimensions, Switch, Platform, ActivityIndicator, Pressable, SectionList, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

//  THEME 
const Theme = {
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

const shadowStyle = {
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84
};

//  SAMPLE DATA 
const initialFolders = [
  { id: 'f1', name: 'Work' },
  { id: 'f2', name: 'Personal' },
  { id: 'f3', name: 'Ideas' },
  { id: 'f4', name: 'Shopping Lists' },
  { id: 'f5', name: 'Recipes' }
];

const initialNotes = [
  { id: 'n1', title: 'Meeting Notes - Project X', content: 'Discussed Q3 strategy, assigned tasks to John and Sarah. Follow-up on budget next week.', folderId: 'f1', tags: ['meeting', 'project-x', 'strategy'], isFavorite: true, audioUri: null, createdAt: new Date('2023-10-26T10:00:00Z').toISOString(), updatedAt: new Date('2023-10-26T10:00:00Z').toISOString() },
  { id: 'n2', title: 'Grocery List', content: 'Milk, Eggs, Bread, Butter, Apples, Spinach, Chicken Breast, Pasta.', folderId: 'f4', tags: ['grocery', 'food'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-25T15:30:00Z').toISOString(), updatedAt: new Date('2023-10-25T15:30:00Z').toISOString() },
  { id: 'n3', title: 'New App Idea: MindFlow', content: 'A journaling app with AI prompts and sentiment analysis. Focus on minimalist UI and offline capabilities.', folderId: 'f3', tags: ['app-idea', 'journaling', 'ai'], isFavorite: true, audioUri: 'audio/mindflow_idea.m4a', createdAt: new Date('2023-10-24T09:00:00Z').toISOString(), updatedAt: new Date('2023-10-24T09:00:00Z').toISOString() },
  { id: 'n4', title: 'Weekend Plans', content: 'Saturday: Hiking at local park. Sunday: Brunch with friends, then movie night.', folderId: 'f2', tags: ['weekend', 'social'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-23T18:00:00Z').toISOString(), updatedAt: new Date('2023-10-23T18:00:00Z').toISOString() },
  { id: 'n5', title: 'Recipe: Spicy Tuna Pasta', content: 'Ingredients: Pasta, canned tuna, chili flakes, garlic, olive oil, cherry tomatoes, parsley.', folderId: 'f5', tags: ['recipe', 'dinner', 'tuna'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-22T12:00:00Z').toISOString(), updatedAt: new Date('2023-10-22T12:00:00Z').toISOString() },
  { id: 'n6', title: 'Client Feedback - Website Redesign', content: 'Client loves the new layout but wants to adjust the color scheme on the contact page. Provide options for softer blues.', folderId: 'f1', tags: ['client', 'website', 'feedback'], isFavorite: true, audioUri: null, createdAt: new Date('2023-10-21T11:00:00Z').toISOString(), updatedAt: new Date('2023-10-21T11:00:00Z').toISOString() },
  { id: 'n7', title: 'Book List', content: '1. The Midnight Library 2. Project Hail Mary 3. Sapiens', folderId: 'f2', tags: ['books', 'reading'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-20T14:00:00Z').toISOString(), updatedAt: new Date('2023-10-20T14:00:00Z').toISOString() },
  { id: 'n8', title: 'Gym Routine', content: 'Monday: Chest & Triceps. Wednesday: Back & Biceps. Friday: Legs & Shoulders. Cardio on Tuesday/Thursday.', folderId: 'f2', tags: ['fitness', 'gym'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-19T07:00:00Z').toISOString(), updatedAt: new Date('2023-10-19T07:00:00Z').toISOString() },
  { id: 'n9', title: 'Blog Post Draft: Future of AI', content: 'Outline: Intro to AI, current applications, ethical considerations, future predictions. Focus on accessibility.', folderId: 'f3', tags: ['blog', 'ai', 'writing'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-18T16:00:00Z').toISOString(), updatedAt: new Date('2023-10-18T16:00:00Z').toISOString() },
  { id: 'n10', title: 'Car Maintenance Reminder', content: 'Oil change due in 1,000 miles. Check tire pressure before long trip next month.', folderId: 'f2', tags: ['car', 'maintenance'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-17T09:00:00Z').toISOString(), updatedAt: new Date('2023-10-17T09:00:00Z').toISOString() },
  { id: 'n11', title: 'Ideas for Birthday Gift', content: 'For Sarah: new headphones, a personalized mug, or a gift card to her favorite bookstore.', folderId: 'f2', tags: ['gift', 'birthday'], isFavorite: false, audioUri: 'audio/birthday_gift_ideas.m4a', createdAt: new Date('2023-10-16T13:00:00Z').toISOString(), updatedAt: new Date('2023-10-16T13:00:00Z').toISOString() },
  { id: 'n12', title: 'Project Alpha - Next Steps', content: 'Finalize design mocks, begin frontend development, set up API endpoints. Schedule daily stand-ups.', folderId: 'f1', tags: ['project', 'development'], isFavorite: true, audioUri: null, createdAt: new Date('2023-10-15T10:00:00Z').toISOString(), updatedAt: new Date('2023-10-15T10:00:00Z').toISOString() },
  { id: 'n13', title: 'Vacation Planning - Japan', content: 'Research flights, accommodation in Tokyo and Kyoto, JR Pass options. Must visit cherry blossoms if possible!', folderId: 'f2', tags: ['travel', 'japan', 'vacation'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-14T11:00:00Z').toISOString(), updatedAt: new Date('2023-10-14T11:00:00Z').toISOString() },
  { id: 'n14', title: 'Workout Music Playlist', content: 'Add more upbeat electronic tracks. Explore new artists like Odesza and Lane 8.', folderId: 'f2', tags: ['music', 'workout'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-13T17:00:00Z').toISOString(), updatedAt: new Date('2023-10-13T17:00:00Z').toISOString() },
  { id: 'n15', title: 'Home Improvement Ideas', content: 'Paint living room, add shelving to bathroom, fix leaky faucet in kitchen.', folderId: 'f2', tags: ['home', 'diy'], isFavorite: false, audioUri: null, createdAt: new Date('2023-10-12T08:00:00Z').toISOString(), updatedAt: new Date('2023-10-12T08:00:00Z').toISOString() },
  { id: 'n16', title: 'Brainstorming - Marketing Campaign', content: 'Keywords: innovative, user-friendly, efficient. Target audience: small businesses and startups.', folderId: 'f1', tags: ['marketing', 'brainstorm'], isFavorite: false, audioUri: 'audio/marketing_campaign.m4a', createdAt: new Date('2023-10-11T14:00:00Z').toISOString(), updatedAt: new Date('2023-10-11T14:00:00Z').toISOString() }
];

//  UTILITY FUNCTIONS 
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const shareNote = async (note) => {
  const shareText = `Note: ${note.title}\n\n${note.content}\n\nFolder: ${note.folderName}\nTags: ${note.tags.join(', ')}`;
  try {
    const supported = await Linking.canOpenURL('mailto:'); // Check if email is available
    if (supported) {
      await Linking.openURL(`mailto:?subject=${encodeURIComponent(note.title)}&body=${encodeURIComponent(shareText)}`);
    } else {
      Alert.alert('Sharing not available', 'Please ensure you have an email app configured.');
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    Alert.alert('Sharing Failed', 'Could not open sharing options.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

//  REUSABLE COMPONENTS 

const Header = ({ title, onBack, rightButton, rightButtonText, rightButtonIcon, onRightButtonPress, showAddButton, onAddPress }) => (
  <LinearGradient
    colors={['#1e293b', '#0f172a']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.headerContainer}
  >
    <View style={styles.headerLeft}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonIcon}>{'< '}</Text>
        </TouchableOpacity>
      )}
    </View>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerRight}>
      {showAddButton && (
        <TouchableOpacity onPress={onAddPress} style={styles.headerButton}>
          <Text style={styles.headerButtonIcon}>{' \u2795'}</Text>
        </TouchableOpacity>
      )}
      {rightButton && (
        <TouchableOpacity onPress={onRightButtonPress} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{rightButtonText}</Text>
          {rightButtonIcon && <Text style={styles.headerButtonIcon}>{rightButtonIcon}</Text>}
        </TouchableOpacity>
      )}
    </View>
  </LinearGradient>
);

const CustomButton = ({ title, onPress, style, textStyle, icon, disabled = false }) => (
  <TouchableOpacity
    onPress={() => {
      if (!disabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    }}
    style={[styles.customButton, style, disabled && styles.customButtonDisabled]}
    disabled={disabled}
  >
    {icon && <Text style={styles.customButtonIcon}>{icon}</Text>}
    <Text style={[styles.customButtonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

const SearchBar = ({ searchTerm, onSearchChange, placeholder = 'Search...' }) => (
  <View style={styles.searchBarContainer}>
    <Text style={styles.searchIcon}>{' \u{1F50D}'}</Text>
    <TextInput
      style={styles.searchTextInput}
      placeholder={placeholder}
      placeholderTextColor={Theme.secondary}
      value={searchTerm}
      onChangeText={onSearchChange}
      selectionColor={Theme.accent}
    />
  </View>
);

const FilterChip = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    style={[styles.filterChip, isSelected && styles.filterChipSelected]}
  >
    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const EmptyState = ({ icon, message, ctaText, onCtaPress }) => (
  <View style={styles.emptyStateContainer}>
    <Text style={styles.emptyStateIcon}>{icon}</Text>
    <Text style={styles.emptyStateMessage}>{message}</Text>
    {onCtaPress && (
      <CustomButton
        title={ctaText}
        onPress={onCtaPress}
        style={styles.emptyStateCtaButton}
        textStyle={{ color: Theme.background }}
      />
    )}
  </View>
);

const Toast = ({ message, type, isVisible, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
          ]).start(() => onDismiss());
        }, 3000);
      });
    }
  }, [isVisible, fadeAnim, slideAnim, onDismiss]);

  if (!isVisible) return null;

  const backgroundColor =
    type === 'success' ? Theme.success :
    type === 'danger' ? Theme.danger :
    Theme.secondary;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        { backgroundColor }
      ]}
    >
      <Text style={styles.toastMessage}>{message}</Text>
    </Animated.View>
  );
};

const NoteCard = ({ note, folderName, onPress, onToggleFavorite }) => (
  <TouchableOpacity
    style={styles.noteCard}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(note.id);
    }}
  >
    <View style={styles.noteCardHeader}>
      <Text style={styles.noteCardTitle} numberOfLines={1}>{note.title}</Text>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onToggleFavorite(note.id);
        }}
        style={styles.favoriteButton}
      >
        <Text style={styles.favoriteIcon}>{note.isFavorite ? '\u2764' : '\u2661'}</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.noteCardContent} numberOfLines={2}>{note.content}</Text>
    <View style={styles.noteCardFooter}>
      {folderName && <Text style={styles.noteCardFolder}>{' \u{1F4CD}'} {folderName}</Text>}
      <Text style={styles.noteCardDate}>{getTimeAgo(note.updatedAt)}</Text>
    </View>
    {note.tags && note.tags.length > 0 && (
      <View style={styles.noteCardTags}>
        {note.tags.map((tag, index) => (
          <Text key={index} style={styles.noteCardTag}>#{tag}</Text>
        ))}
      </View>
    )}
  </TouchableOpacity>
);

const FolderCard = ({ folder, noteCount, onPress, onEdit, onDelete }) => (
  <Pressable
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(folder.id);
    }}
    onLongPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Folder Actions',
        `What do you want to do with "${folder.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => onEdit(folder) },
          { text: 'Delete', onPress: () => onDelete(folder.id), style: 'destructive' }
        ]
      );
    }}
    style={styles.folderCard}
  >
    <Text style={styles.folderIcon}>{' \u{1F4C1}'}</Text>
    <View style={styles.folderInfo}>
      <Text style={styles.folderName}>{folder.name}</Text>
      <Text style={styles.folderNoteCount}>{noteCount} notes</Text>
    </View>
  </Pressable>
);

const AudioPlayer = ({ audioUri }) => {
  if (!audioUri) return null;

  // Simulate audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const duration = 15000; // Simulate 15 audio
  const intervalRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + (100 / (duration / 100)); // Increment by 1% every 100ms
        });
      }, 100);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioPlayerContainer}>
      <TouchableOpacity onPress={togglePlay} style={styles.audioPlayButton}>
        <Text style={styles.audioPlayIcon}>{isPlaying ? '\u23F8' : '\u25B6'}</Text>
      </TouchableOpacity>
      <View style={styles.audioProgressBarBackground}>
        <View style={[styles.audioProgressBarFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.audioTime}>{formatTime(isPlaying ? (progress / 100) * duration : duration)}</Text>
    </View>
  );
};

//  SCREEN COMPONENTS 

const HomeScreen = ({ navigateToNotes, navigateToFolders, showToast, notes, folders }) => {
  const recentNotes = useMemo(() =>
    notes.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    [notes]
  );
  const favoriteNotes = useMemo(() =>
    notes.filter(note => note.isFavorite).slice(0, 5),
    [notes]
  );

  const totalNotes = notes.length;
  const totalFolders = folders.length;

  const getFolderName = useCallback((folderId) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Uncategorized';
  }, [folders]);

  return (
    <View style={styles.screenContainer}>
      <Header title="Notepad Dashboard" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalNotes}</Text>
            <Text style={styles.statLabel}>Total Notes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalFolders}</Text>
            <Text style={styles.statLabel}>Total Folders</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Notes</Text>
        {recentNotes.length === 0 ? (
          <EmptyState
            icon="\u{1F4DD}"
            message="No recent notes yet!"
            ctaText="Create your first note"
            onCtaPress={() => navigateToNotes('add')}
          />
        ) : (
          <FlatList
            data={recentNotes}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                folderName={getFolderName(item.folderId)}
                onPress={() => navigateToNotes('detail', item.id)}
                onToggleFavorite={() => { /* Handled in main App.js */ }}
                style={styles.horizontalNoteCard}
              />
            )}
            contentContainerStyle={styles.horizontalListContainer}
          />
        )}

        <Text style={styles.sectionTitle}>Favorite Notes</Text>
        {favoriteNotes.length === 0 ? (
          <EmptyState
            icon="\u2764"
            message="No favorites yet!"
            ctaText="Star some notes"
            onCtaPress={() => navigateToNotes('list')}
          />
        ) : (
          <FlatList
            data={favoriteNotes}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                folderName={getFolderName(item.folderId)}
                onPress={() => navigateToNotes('detail', item.id)}
                onToggleFavorite={() => { /* Handled in main App.js */ }}
                style={styles.horizontalNoteCard}
              />
            )}
            contentContainerStyle={styles.horizontalListContainer}
          />
        )}
      </ScrollView>
    </View>
  );
};

const NotesListScreen = ({ notes, folders, navigateToNotes, onToggleFavorite, showToast, refreshNotes, isRefreshing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [sortOption, setSortOption] = useState('updatedAt_desc'); // createdAt_asc, title_asc etc.
  const [showSortModal, setShowSortModal] = useState(false);

  const getFolderName = useCallback((folderId) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Uncategorized';
  }, [folders]);

  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes;

    // Filter by folder
    if (selectedFolderFilter !== 'all') {
      filtered = filtered.filter(note => note.folderId === selectedFolderFilter);
    }

    // Filter by tag
    if (selectedTagFilter !== 'all') {
      filtered = filtered.filter(note => note.tags.includes(selectedTagFilter));
    }

    // Search
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(lowerSearchTerm) ||
        note.content.toLowerCase().includes(lowerSearchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      switch (sortOption) {
        case 'updatedAt_desc': return dateB - dateA;
        case 'updatedAt_asc': return dateA - dateB;
        case 'createdAt_desc': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'createdAt_asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title_asc': return titleA.localeCompare(titleB);
        case 'title_desc': return titleB.localeCompare(titleA);
        default: return 0;
      }
    });

    return filtered;
  }, [notes, searchTerm, selectedFolderFilter, selectedTagFilter, sortOption]);

  const SortOptionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSortModal}
      onRequestClose={() => setShowSortModal(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
        <View style={styles.sortModalContent}>
          <Text style={styles.sortModalTitle}>Sort By</Text>
          {[
            { label: 'Last Modified (Newest)', value: 'updatedAt_desc' },
            { label: 'Last Modified (Oldest)', value: 'updatedAt_asc' },
            { label: 'Created Date (Newest)', value: 'createdAt_desc' },
            { label: 'Created Date (Oldest)', value: 'createdAt_asc' },
            { label: 'Title (A-Z)', value: 'title_asc' },
            { label: 'Title (Z-A)', value: 'title_desc' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOptionItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortOption(option.value);
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortOption === option.value && styles.sortOptionTextSelected
              ]}>
                {option.label}
              </Text>
              {sortOption === option.value && <Text style={styles.sortOptionCheck}>{' \u2705'}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.screenContainer}>
      <Header
        title="All Notes"
        showAddButton={true}
        onAddPress={() => navigateToNotes('add')}
        rightButton={true}
        rightButtonIcon={'\u{1F504}'}
        onRightButtonPress={refreshNotes}
      />
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search notes, tags..." />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        <FilterChip
          label="All Notes"
          isSelected={selectedFolderFilter === 'all' && selectedTagFilter === 'all'}
          onPress={() => { setSelectedFolderFilter('all'); setSelectedTagFilter('all'); }}
        />
        {folders.map(folder => (
          <FilterChip
            key={folder.id}
            label={folder.name}
            isSelected={selectedFolderFilter === folder.id}
            onPress={() => { setSelectedFolderFilter(folder.id); setSelectedTagFilter('all'); }}
          />
        ))}
        {allTags.map(tag => (
          <FilterChip
            key={tag}
            label={`#${tag}`}
            isSelected={selectedTagFilter === tag}
            onPress={() => { setSelectedTagFilter(tag); setSelectedFolderFilter('all'); }}
          />
        ))}
      </ScrollView>

      <View style={styles.sortOptionsContainer}>
        <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.sortButton}>
          <Text style={styles.sortButtonText}>{' \u{2B07}'} Sort: {sortOption.split('_')[0].replace('At', '')} {sortOption.includes('desc') ? 'Desc' : 'Asc'}</Text>
        </TouchableOpacity>
      </View>

      {isRefreshing && <ActivityIndicator size="small" color={Theme.accent} style={{ marginTop: 16 }} />}

      {filteredAndSortedNotes.length === 0 ? (
        <EmptyState
          icon="\u{1F4DD}"
          message="No notes found matching your criteria."
          ctaText="Clear Filters"
          onCtaPress={() => {
            setSearchTerm('');
            setSelectedFolderFilter('all');
            setSelectedTagFilter('all');
          }}
        />
      ) : (
        <FlatList
          data={filteredAndSortedNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              folderName={getFolderName(item.folderId)}
              onPress={() => navigateToNotes('detail', item.id)}
              onToggleFavorite={onToggleFavorite}
            />
          )}
          contentContainerStyle={styles.flatListContent}
          onRefresh={refreshNotes}
          refreshing={isRefreshing}
        />
      )}
      <SortOptionModal />
    </View>
  );
};

const NoteDetailScreen = ({ note, folderName, onBack, onDeleteNote, onEditNote, onToggleFavorite, showToast }) => {
  if (!note) {
    return (
      <View style={styles.screenContainer}>
        <Header title="Note Not Found" onBack={onBack} />
        <EmptyState icon="\u274C" message="The note you are looking for does not exist." ctaText="Go Back" onCtaPress={onBack} />
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            onDeleteNote(note.id);
            showToast('Note deleted successfully!', 'success');
            onBack();
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleShare = () => {
    shareNote({ ...note, folderName });
    showToast('Note shared!', 'success');
  };

  return (
    <View style={styles.screenContainer}>
      <Header
        title={note.title}
        onBack={onBack}
        rightButton={true}
        rightButtonText="Edit"
        rightButtonIcon={'\u270F'}
        onRightButtonPress={() => onEditNote(note.id)}
      />
      <ScrollView contentContainerStyle={styles.detailScrollContent}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{note.title}</Text>
          <Text style={styles.detailContent}>{note.content}</Text>

          {note.audioUri && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Audio Recording</Text>
              <AudioPlayer audioUri={note.audioUri} />
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Details</Text>
            <Text style={styles.detailMeta}>{' \u{1F4CD}'} Folder: {folderName}</Text>
            {note.tags && note.tags.length > 0 && (
              <View style={styles.detailTagsContainer}>
                <Text style={styles.detailMeta}>{' \u{1F3F7}'} Tags: </Text>
                {note.tags.map((tag, index) => (
                  <Text key={index} style={styles.detailTag}>#{tag}</Text>
                ))}
              </View>
            )}
            <Text style={styles.detailMeta}>{' \u{1F4C5}'} Created: {formatDate(note.createdAt)}</Text>
            <Text style={styles.detailMeta}>{' \u{1F504}'} Last Updated: {getTimeAgo(note.updatedAt)}</Text>
          </View>

          <View style={styles.detailActionButtons}>
            <CustomButton
              title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
              icon={note.isFavorite ? '\u2764' : '\u2661'}
              onPress={() => {
                onToggleFavorite(note.id);
                showToast(note.isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success');
              }}
              style={styles.detailActionButton}
            />
            <CustomButton
              title="Share"
              icon={'\u{1F4E4}'}
              onPress={handleShare}
              style={styles.detailActionButton}
            />
            <CustomButton
              title="Delete"
              icon={'\u{1F5D1}'}
              onPress={handleDelete}
              style={[styles.detailActionButton, { backgroundColor: Theme.danger }]}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const AddEditNoteScreen = ({ noteToEdit, onBack, onSaveNote, folders, showToast }) => {
  const [title, setTitle] = useState(noteToEdit ? noteToEdit.title : '');
  const [content, setContent] = useState(noteToEdit ? noteToEdit.content : '');
  const [selectedFolderId, setSelectedFolderId] = useState(noteToEdit ? noteToEdit.folderId : (folders.length > 0 ? folders[0].id : ''));
  const [tagsInput, setTagsInput] = useState(noteToEdit ? noteToEdit.tags.join(', ') : '');
  const [audioUri, setAudioUri] = useState(noteToEdit ? noteToEdit.audioUri : null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // in seconds
  const [showFolderModal, setShowFolderModal] = useState(false);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingIntervalRef.current);
    }
    return () => clearInterval(recordingIntervalRef.current);
  }, [isRecording]);

  const handleSave = () => {
    if (!title.trim()) {
      showToast('Note title cannot be empty!', 'danger');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!selectedFolderId && folders.length > 0) {
      showToast('Please select a folder!', 'danger');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const newTags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    const newNote = {
      id: noteToEdit ? noteToEdit.id : generateId(),
      title,
      content,
      folderId: selectedFolderId,
      tags: newTags,
      isFavorite: noteToEdit ? noteToEdit.isFavorite : false,
      audioUri: audioUri,
      createdAt: noteToEdit ? noteToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSaveNote(newNote);
    showToast(noteToEdit ? 'Note updated successfully!' : 'Note created successfully!', 'success');
    onBack();
  };

  const toggleRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) {
      setIsRecording(false);
      // Simulate saving audio
      setAudioUri(`audio/${generateId()}.m4a`);
      setRecordingDuration(0);
    } else {
      setIsRecording(true);
      setAudioUri(null); // Clear previous audio when starting new recording
    }
  };

  const removeAudio = () => {
    Alert.alert(
      'Remove Audio',
      'Are you sure you want to remove this audio recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => setAudioUri(null), style: 'destructive' }
      ]
    );
  };

  const formatAudioDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const FolderSelectionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showFolderModal}
      onRequestClose={() => setShowFolderModal(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowFolderModal(false)}>
        <View style={styles.folderModalContent}>
          <Text style={styles.folderModalTitle}>Select Folder</Text>
          <ScrollView>
            {folders.map(folder => (
              <TouchableOpacity
                key={folder.id}
                style={styles.folderOptionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFolderId(folder.id);
                  setShowFolderModal(false);
                }}
              >
                <Text style={[
                  styles.folderOptionText,
                  selectedFolderId === folder.id && styles.folderOptionTextSelected
                ]}>
                  {folder.name}
                </Text>
                {selectedFolderId === folder.id && <Text style={styles.folderOptionCheck}>{' \u2705'}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <CustomButton title="Cancel" onPress={() => setShowFolderModal(false)} style={styles.modalCancelButton} />
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.screenContainer}>
      <Header
        title={noteToEdit ? 'Edit Note' : 'Create Note'}
        onBack={onBack}
        rightButton={true}
        rightButtonText="Save"
        rightButtonIcon={'\u{1F4BE}'}
        onRightButtonPress={handleSave}
      />
      <ScrollView contentContainerStyle={styles.formScrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Title</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Note title..."
            placeholderTextColor={Theme.secondary}
            value={title}
            onChangeText={setTitle}
            selectionColor={Theme.accent}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Content</Text>
          <TextInput
            style={[styles.formInput, styles.formInputMultiline]}
            placeholder="Note content..."
            placeholderTextColor={Theme.secondary}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            selectionColor={Theme.accent}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Folder</Text>
          <TouchableOpacity onPress={() => setShowFolderModal(true)} style={styles.folderSelectButton}>
            <Text style={styles.folderSelectButtonText}>
              {selectedFolderId ? (folders.find(f => f.id === selectedFolderId)?.name || 'Select Folder') : 'Select Folder'}
            </Text>
            <Text style={styles.folderSelectButtonIcon}>{' \u2B9E'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Tags (comma separated)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="work, idea, personal"
            placeholderTextColor={Theme.secondary}
            value={tagsInput}
            onChangeText={setTagsInput}
            selectionColor={Theme.accent}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Audio Recording</Text>
          <View style={styles.audioControls}>
            <CustomButton
              title={isRecording ? 'Stop Recording' : 'Record Audio'}
              icon={isRecording ? '\u23F9' : '\u{1F3A4}'}
              onPress={toggleRecording}
              style={[styles.recordButton, isRecording && { backgroundColor: Theme.danger }]}
            />
            {isRecording && <Text style={styles.recordingStatus}>Recording: {formatAudioDuration(recordingDuration)}</Text>}
            {!isRecording && audioUri && (
              <View style={styles.audioPlaybackContainer}>
                <AudioPlayer audioUri={audioUri} />
                <CustomButton
                  title="Remove"
                  icon={'\u{1F5D1}'}
                  onPress={removeAudio}
                  style={{ backgroundColor: Theme.muted, marginLeft: 10, paddingVertical: 8, paddingHorizontal: 12 }}
                  textStyle={{ fontSize: 14 }}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <FolderSelectionModal />
    </View>
  );
};

const FoldersScreen = ({ folders, notes, onBack, onCreateFolder, onUpdateFolder, onDeleteFolder, showToast }) => {
  const [showAddEditFolderModal, setShowAddEditFolderModal] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // For editing

  const getNoteCountForFolder = useCallback((folderId) => {
    return notes.filter(note => note.folderId === folderId).length;
  }, [notes]);

  const handleEditFolder = (folder) => {
    setCurrentFolder(folder);
    setShowAddEditFolderModal(true);
  };

  const handleDeleteFolder = (folderId) => {
    const noteCount = getNoteCountForFolder(folderId);
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete this folder? It contains ${noteCount} notes. These notes will become uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            onDeleteFolder(folderId);
            showToast('Folder deleted successfully!', 'success');
          },
          style: 'destructive'
        }
      ]
    );
  };

  const AddEditFolderModal = () => {
    const [folderName, setFolderName] = useState(currentFolder ? currentFolder.name : '');

    const handleSaveFolder = () => {
      if (!folderName.trim()) {
        showToast('Folder name cannot be empty!', 'danger');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (currentFolder) {
        onUpdateFolder({ ...currentFolder, name: folderName });
        showToast('Folder updated successfully!', 'success');
      } else {
        onCreateFolder({ id: generateId(), name: folderName });
        showToast('Folder created successfully!', 'success');
      }
      setFolderName('');
      setCurrentFolder(null);
      setShowAddEditFolderModal(false);
    };

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddEditFolderModal}
        onRequestClose={() => {
          setShowAddEditFolderModal(false);
          setCurrentFolder(null);
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => {
          setShowAddEditFolderModal(false);
          setCurrentFolder(null);
        }}>
          <Pressable style={styles.addEditFolderModalContent}>
            <Text style={styles.addEditFolderModalTitle}>{currentFolder ? 'Edit Folder' : 'Create New Folder'}</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Folder name..."
              placeholderTextColor={Theme.secondary}
              value={folderName}
              onChangeText={setFolderName}
              selectionColor={Theme.accent}
            />
            <View style={styles.modalButtonContainer}>
              <CustomButton
                title="Cancel"
                onPress={() => {
                  setShowAddEditFolderModal(false);
                  setCurrentFolder(null);
                }}
                style={[styles.modalButton, { backgroundColor: Theme.muted }]}
              />
              <CustomButton
                title={currentFolder ? 'Update' : 'Create'}
                onPress={handleSaveFolder}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <Header
        title="Folders"
        showAddButton={true}
        onAddPress={() => {
          setCurrentFolder(null);
          setShowAddEditFolderModal(true);
        }}
      />
      {folders.length === 0 ? (
        <EmptyState
          icon="\u{1F4C1}"
          message="No folders yet!"
          ctaText="Create a new folder"
          onCtaPress={() => setShowAddEditFolderModal(true)}
        />
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FolderCard
              folder={item}
              noteCount={getNoteCountForFolder(item.id)}
              onPress={() => { /* Not implemented: drill down to notes in folder */ showToast(`Viewing notes in "${item.name}"`, 'secondary'); }}
              onEdit={handleEditFolder}
              onDelete={handleDeleteFolder}
            />
          )}
          contentContainerStyle={styles.flatListContent}
        />
      )}
      <AddEditFolderModal />
    </View>
  );
};

const SettingsScreen = ({ settings, onUpdateSettings, showToast, clearAllData }) => {
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete ALL notes, folders, and settings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          onPress: () => {
            clearAllData();
            showToast('All data cleared successfully!', 'success');
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>General</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Confirm Deletion</Text>
            <Switch
              trackColor={{ false: Theme.muted, true: Theme.accent }}
              thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''}
              ios_backgroundColor={Theme.muted}
              onValueChange={(value) => onUpdateSettings('confirmDeletion', value)}
              value={settings.confirmDeletion}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>About App</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Developer</Text>
            <Text style={styles.settingValue}>ZeroBuild AI</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.google.com')} style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingValue}>{' \u2B9E'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <CustomButton
            title="Clear All Data"
            onPress={handleClearAllData}
            style={styles.clearDataButton}
            textStyle={{ color: Theme.background }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

//  MAIN APP 
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState(null); // null, 'detail', 'add', 'edit'
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [settings, setSettings] = useState({ confirmDeletion: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingNotes, setIsRefreshingNotes] = useState(false);

  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const screenTransitionAnim = useRef(new Animated.Value(0)).current;

  // 1. Load data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem('notes');
        const storedFolders = await AsyncStorage.getItem('folders');
        const storedSettings = await AsyncStorage.getItem('settings');

        setNotes(storedNotes ? JSON.parse(storedNotes) : initialNotes);
        setFolders(storedFolders ? JSON.parse(storedFolders) : initialFolders);
        setSettings(storedSettings ? JSON.parse(storedSettings) : { confirmDeletion: true });
      } catch (error) {
        console.error('Failed to load data from AsyncStorage:', error);
        showToast('Failed to load data!', 'danger');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Save data to AsyncStorage whenever state changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('notes', JSON.stringify(notes));
        await AsyncStorage.setItem('folders', JSON.stringify(folders));
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save data to AsyncStorage:', error);
        showToast('Failed to save data!', 'danger');
      }
    };
    if (!isLoading) { // Only save after initial load
      saveData();
    }
  }, [notes, folders, settings, isLoading]);

  // Screen transition animation
  useEffect(() => {
    Animated.timing(screenTransitionAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    return () => screenTransitionAnim.setValue(0);
  }, [currentScreen, activeTab, screenTransitionAnim]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ isVisible: true, message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const navigateToNotes = useCallback((screen, id = null) => {
    setSelectedNoteId(id);
    setCurrentScreen(screen);
    setActiveTab('notes');
  }, []);

  const handleBack = useCallback(() => {
    setCurrentScreen(null);
    setSelectedNoteId(null);
  }, []);

  // --- Notes CRUD ---
  const handleSaveNote = useCallback((newNote) => {
    setNotes(prevNotes => {
      const existingIndex = prevNotes.findIndex(note => note.id === newNote.id);
      if (existingIndex > -1) {
        return prevNotes.map(note => (note.id === newNote.id ? newNote : note));
      } else {
        return [...prevNotes, newNote];
      }
    });
  }, []);

  const handleDeleteNote = useCallback((id) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  }, []);

  const handleToggleFavorite = useCallback((id) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, isFavorite: !note.isFavorite } : note
      )
    );
  }, []);

  const refreshNotes = useCallback(async () => {
    setIsRefreshingNotes(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network refresh
    // In a real app, this would re-fetch from backend. Here, just set refreshing to false.
    setIsRefreshingNotes(false);
    showToast('Notes refreshed!', 'secondary');
  }, [showToast]);

  // --- Folders CRUD ---
  const handleCreateFolder = useCallback((newFolder) => {
    setFolders(prevFolders => [...prevFolders, newFolder]);
  }, []);

  const handleUpdateFolder = useCallback((updatedFolder) => {
    setFolders(prevFolders =>
      prevFolders.map(folder => (folder.id === updatedFolder.id ? updatedFolder : folder))
    );
  }, []);

  const handleDeleteFolder = useCallback((id) => {
    setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));
    setNotes(prevNotes =>
      prevNotes.map(note => (note.folderId === id ? { ...note, folderId: null } : note))
    ); // Uncategorize notes
  }, []);

  // --- Settings ---
  const handleUpdateSettings = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearAllData = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      setNotes(initialNotes);
      setFolders(initialFolders);
      setSettings({ confirmDeletion: true });
      showToast('All app data has been cleared!', 'success');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      showToast('Failed to clear all data!', 'danger');
    }
  }, [showToast]);

  const getFolderName = useCallback((folderId) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Uncategorized';
  }, [folders]);

  const renderContent = () => {
    const selectedNote = selectedNoteId ? notes.find(n => n.id === selectedNoteId) : null;

    if (currentScreen === 'detail') {
      return (
        <NoteDetailScreen
          note={selectedNote}
          folderName={selectedNote ? getFolderName(selectedNote.folderId) : 'N/A'}
          onBack={handleBack}
          onDeleteNote={handleDeleteNote}
          onEditNote={(id) => { setSelectedNoteId(id); setCurrentScreen('edit'); }}
          onToggleFavorite={handleToggleFavorite}
          showToast={showToast}
        />
      );
    }
    if (currentScreen === 'add' || currentScreen === 'edit') {
      return (
        <AddEditNoteScreen
          noteToEdit={selectedNote}
          onBack={handleBack}
          onSaveNote={handleSaveNote}
          folders={folders}
          showToast={showToast}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            navigateToNotes={navigateToNotes}
            navigateToFolders={() => setActiveTab('folders')}
            showToast={showToast}
            notes={notes}
            folders={folders}
          />
        );
      case 'notes':
        return (
          <NotesListScreen
            notes={notes}
            folders={folders}
            navigateToNotes={navigateToNotes}
            onToggleFavorite={handleToggleFavorite}
            showToast={showToast}
            refreshNotes={refreshNotes}
            isRefreshing={isRefreshingNotes}
          />
        );
      case 'folders':
        return (
          <FoldersScreen
            folders={folders}
            notes={notes}
            onBack={handleBack}
            onCreateFolder={handleCreateFolder}
            onUpdateFolder={handleUpdateFolder}
            onDeleteFolder={handleDeleteFolder}
            showToast={showToast}
          />
        );
      case 'add':
        return (
          <AddEditNoteScreen
            noteToEdit={null}
            onBack={() => setActiveTab('home')} // Go back to home after adding
            onSaveNote={handleSaveNote}
            folders={folders}
            showToast={showToast}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            showToast={showToast}
            clearAllData={handleClearAllData}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading your notes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar style="light" />
      <Animated.View style={[styles.contentContainer, { opacity: screenTransitionAnim }]}>
        {renderContent()}
      </Animated.View>

      {!currentScreen && ( // Hide tab bar when drilling down
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.selectionAsync(); setActiveTab('home'); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>{'\u{1F3E0}'}</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.selectionAsync(); setActiveTab('notes'); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'notes' && styles.tabIconActive]}>{'\u{1F4DD}'}</Text>
            <Text style={[styles.tabLabel, activeTab === 'notes' && styles.tabLabelActive]}>Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.selectionAsync(); setActiveTab('folders'); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'folders' && styles.tabIconActive]}>{'\u{1F4C1}'}</Text>
            <Text style={[styles.tabLabel, activeTab === 'folders' && styles.tabLabelActive]}>Folders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.selectionAsync(); setActiveTab('add'); setCurrentScreen('add'); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'add' && styles.tabIconActive]}>{'\u2795'}</Text>
            <Text style={[styles.tabLabel, activeTab === 'add' && styles.tabLabelActive]}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => { Haptics.selectionAsync(); setActiveTab('settings'); }}
          >
            <Text style={[styles.tabIcon, activeTab === 'settings' && styles.tabIconActive]}>{'\u2699'}</Text>
            <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onDismiss={dismissToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: Theme.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background
  },
  loadingText: {
    color: Theme.text,
    marginTop: 10,
    fontSize: 16
  },
  contentContainer: {
    flex: 1
  },
  screenContainer: {
    flex: 1,
    backgroundColor: Theme.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // For tab bar
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 80
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surface,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10
  },
  headerLeft: {
    width: 60
  },
  headerRight: {
    width: 60,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.text,
    flex: 1,
    textAlign: 'center'
  },
  headerButton: {
    padding: 8,
    borderRadius: 8
  },
  headerButtonText: {
    color: Theme.accent,
    fontSize: 16,
    fontWeight: '500'
  },
  headerButtonIcon: {
    color: Theme.accent,
    fontSize: 20
  },

  // Tab Bar
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Theme.elevated,
    borderTopWidth: 1,
    borderTopColor: Theme.surface,
    paddingVertical: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...shadowStyle
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    flex: 1
  },
  tabIcon: {
    fontSize: 24,
    color: Theme.muted
  },
  tabIconActive: {
    color: Theme.accent
  },
  tabLabel: {
    fontSize: 12,
    color: Theme.muted,
    marginTop: 4
  },
  tabLabelActive: {
    color: Theme.accent,
    fontWeight: '600'
  },

  // Custom Button
  customButton: {
    backgroundColor: Theme.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadowStyle
  },
  customButtonDisabled: {
    backgroundColor: Theme.muted
  },
  customButtonText: {
    color: Theme.background,
    fontSize: 16,
    fontWeight: '600'
  },
  customButtonIcon: {
    fontSize: 18,
    color: Theme.background,
    marginRight: 8
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    margin: 16,
    ...shadowStyle
  },
  searchIcon: {
    fontSize: 20,
    color: Theme.secondary,
    marginRight: 8
  },
  searchTextInput: {
    flex: 1,
    height: 44,
    color: Theme.text,
    fontSize: 16
  },

  // Filter Chips
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  filterChip: {
    backgroundColor: Theme.surface,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.muted
  },
  filterChipSelected: {
    backgroundColor: Theme.accent,
    borderColor: Theme.accent
  },
  filterChipText: {
    color: Theme.secondary,
    fontSize: 14
  },
  filterChipTextSelected: {
    color: Theme.background,
    fontWeight: '600'
  },

  // Sort Options
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  sortButton: {
    backgroundColor: Theme.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  sortButtonText: {
    color: Theme.secondary,
    fontSize: 14,
    marginLeft: 4
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  sortModalContent: {
    backgroundColor: Theme.elevated,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    ...shadowStyle
  },
  sortModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 15,
    textAlign: 'center'
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surface
  },
  sortOptionItemLast: {
    borderBottomWidth: 0
  },
  sortOptionText: {
    fontSize: 16,
    color: Theme.secondary
  },
  sortOptionTextSelected: {
    color: Theme.accent,
    fontWeight: '600'
  },
  sortOptionCheck: {
    fontSize: 18,
    color: Theme.success
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200
  },
  emptyStateIcon: {
    fontSize: 60,
    color: Theme.muted,
    marginBottom: 15
  },
  emptyStateMessage: {
    fontSize: 18,
    color: Theme.secondary,
    textAlign: 'center',
    marginBottom: 20
  },
  emptyStateCtaButton: {
    backgroundColor: Theme.accent,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: '5%',
    width: '90%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyle
  },
  toastMessage: {
    color: Theme.text,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center'
  },

  // Note Card
  noteCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    ...shadowStyle,
    borderColor: Theme.surface,
    borderWidth: 1
  },
  horizontalNoteCard: {
    width: width * 0.8,
    marginRight: 12,
    backgroundColor: Theme.elevated
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  noteCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text,
    flex: 1,
    marginRight: 10
  },
  favoriteButton: {
    padding: 4
  },
  favoriteIcon: {
    fontSize: 20,
    color: Theme.danger
  },
  noteCardContent: {
    fontSize: 14,
    color: Theme.secondary,
    marginBottom: 8
  },
  noteCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  noteCardFolder: {
    fontSize: 12,
    color: Theme.muted,
    fontWeight: '500'
  },
  noteCardDate: {
    fontSize: 12,
    color: Theme.muted
  },
  noteCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  noteCardTag: {
    backgroundColor: Theme.background,
    color: Theme.accent,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    fontWeight: '500'
  },

  // Folder Card
  folderCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadowStyle
  },
  folderIcon: {
    fontSize: 30,
    color: Theme.accent,
    marginRight: 16
  },
  folderInfo: {
    flex: 1
  },
  folderName: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text
  },
  folderNoteCount: {
    fontSize: 14,
    color: Theme.secondary,
    marginTop: 4
  },

  // Home Screen specific
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  statCard: {
    backgroundColor: Theme.elevated,
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    ...shadowStyle
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.accent
  },
  statLabel: {
    fontSize: 16,
    color: Theme.secondary,
    marginTop: 5
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.text,
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 16
  },
  horizontalListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  // Note Detail
  detailScrollContent: {
    padding: 16,
    paddingBottom: 80, // For potential buttons at bottom
  },
  detailCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 20,
    ...shadowStyle
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 10
  },
  detailContent: {
    fontSize: 16,
    color: Theme.secondary,
    lineHeight: 24,
    marginBottom: 20
  },
  detailSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: Theme.elevated,
    paddingTop: 15
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 10
  },
  detailMeta: {
    fontSize: 14,
    color: Theme.muted,
    marginBottom: 5
  },
  detailTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 5
  },
  detailTag: {
    backgroundColor: Theme.background,
    color: Theme.accent,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    fontWeight: '500'
  },
  detailActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25
  },
  detailActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: Theme.elevated,
    marginHorizontal: 5,
    flex: 1
  },

  // Audio Player
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 10
  },
  audioPlayButton: {
    padding: 8,
    backgroundColor: Theme.accent,
    borderRadius: 20,
    marginRight: 10
  },
  audioPlayIcon: {
    fontSize: 18,
    color: Theme.background
  },
  audioProgressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.muted,
    borderRadius: 3,
    marginRight: 10
  },
  audioProgressBarFill: {
    height: '100%',
    backgroundColor: Theme.success,
    borderRadius: 3
  },
  audioTime: {
    fontSize: 14,
    color: Theme.secondary
  },

  // Forms
  formScrollContent: {
    padding: 16,
    paddingBottom: 80
  },
  formGroup: {
    marginBottom: 20
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 8
  },
  formInput: {
    backgroundColor: Theme.surface,
    color: Theme.text,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    ...shadowStyle
  },
  formInputMultiline: {
    minHeight: 120,
    paddingTop: 12
  },
  folderSelectButton: {
    backgroundColor: Theme.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadowStyle
  },
  folderSelectButtonText: {
    color: Theme.text,
    fontSize: 16
  },
  folderSelectButtonIcon: {
    color: Theme.secondary,
    fontSize: 18
  },
  folderModalContent: {
    backgroundColor: Theme.elevated,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: height * 0.7,
    ...shadowStyle
  },
  folderModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 15,
    textAlign: 'center'
  },
  folderOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surface
  },
  folderOptionText: {
    fontSize: 16,
    color: Theme.secondary
  },
  folderOptionTextSelected: {
    color: Theme.accent,
    fontWeight: '600'
  },
  folderOptionCheck: {
    fontSize: 18,
    color: Theme.success
  },
  modalCancelButton: {
    marginTop: 20,
    backgroundColor: Theme.muted
  },

  // Audio Recording
  audioControls: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 10
  },
  recordButton: {
    backgroundColor: Theme.accent,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10
  },
  recordingStatus: {
    color: Theme.danger,
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500'
  },
  audioPlaybackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '100%'
  },

  // Add/Edit Folder Modal
  addEditFolderModalContent: {
    backgroundColor: Theme.elevated,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    ...shadowStyle
  },
  addEditFolderModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 15,
    textAlign: 'center'
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5
  },

  // Settings
  settingsSection: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...shadowStyle
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.elevated,
    paddingBottom: 10
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.elevated
  },
  settingItemLast: {
    borderBottomWidth: 0
  },
  settingLabel: {
    fontSize: 16,
    color: Theme.text
  },
  settingValue: {
    fontSize: 16,
    color: Theme.secondary
  },
  clearDataButton: {
    backgroundColor: Theme.danger,
    marginTop: 10
  }
});