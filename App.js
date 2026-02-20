import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, Modal, Alert, Animated, ScrollView, Image, Dimensions, Switch, Platform, ActivityIndicator, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
  danger: '#ef4444',
  shadowColor: '#000'
};

const { width: screenWidth } = Dimensions.get('window');

//  UTILITY FUNCTIONS 
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(days / 365);
  return `${years} years ago`;
};

const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

//  SAMPLE DATA 
const sampleTags = ['Work', 'Personal', 'Ideas', 'Shopping', 'Health', 'Meeting', 'Project A', 'Finance', 'Study'];

const createSampleNote = (idSuffix, title, content, tags, isStarred, daysAgo, hasAttachment = false) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const createdAt = date.toISOString();
  const updatedAt = date.toISOString();
  return {
    id: `note-${idSuffix}`,
    title: title,
    content: content,
    tags: tags,
    isStarred: isStarred,
    createdAt: createdAt,
    updatedAt: updatedAt,
    attachment: hasAttachment ? { type: 'image', uri: 'https://via.placeholder.com/150/00d4ff/0f172a?text=Attachment' } : null
  };
};

const initialNotes = [
  createSampleNote(1, "Meeting Notes - Project X", "Discussed Q3 strategy, assigned tasks to John and Sarah. Follow up on budget allocation by Friday. Need to schedule next sync.", ['Work', 'Meeting', 'Project A'], true, 0),
  createSampleNote(2, "Grocery List", "Milk, Eggs, Bread, Butter, Coffee, Apples, Chicken breast, Spinach, Olive oil, Pasta.", ['Personal', 'Shopping'], false, 1),
  createSampleNote(3, "Book Ideas for Summer", "1. 'The Midnight Library' by Matt Haig. 2. 'Project Hail Mary' by Andy Weir. 3. 'Circe' by Madeline Miller. 4. 'Dune' by Frank Herbert.", ['Personal', 'Ideas'], true, 2),
  createSampleNote(4, "Workout Plan - Week 3", "Monday: Chest & Triceps. Tuesday: Back & Biceps. Wednesday: Legs & Shoulders. Thursday: Rest. Friday: Full Body. Weekend: Cardio.", ['Health', 'Personal'], false, 3),
  createSampleNote(5, "Brainstorming Session - Marketing Campaign", "Target audience analysis, social media platforms, influencer outreach, budget considerations. Draft initial concepts by end of week.", ['Work', 'Ideas'], false, 4, true),
  createSampleNote(6, "Recipe: Spicy Chicken Stir-fry", "Ingredients: Chicken, bell peppers, onion, broccoli, soy sauce, ginger, garlic, chili flakes. Steps: Marinate chicken, stir-fry veggies, combine.", ['Personal'], false, 5),
  createSampleNote(7, "Financial Goals - Q4", "Review investment portfolio, save 15% of income, pay off credit card debt. Consult with financial advisor.", ['Finance', 'Personal'], true, 6),
  createSampleNote(8, "New Feature Idea - App", "Implement dark mode toggle, add multi-select for notes, improve search algorithm, integrate cloud sync for attachments.", ['Work', 'Ideas', 'Project A'], false, 7),
  createSampleNote(9, "To-Do List - Weekend", "Clean apartment, laundry, call mom, prepare for Monday meeting, read 30 mins.", ['Personal'], false, 8),
  createSampleNote(10, "Important Reminders", "Renew passport by end of month. Annual check-up next week. Pay utility bill.", ['Personal'], true, 9),
  createSampleNote(11, "Project Alpha - Status Update", "Phase 1 completed. Moving to Phase 2: User Acceptance Testing. Identified minor bugs, fixing in progress.", ['Work', 'Project A', 'Meeting'], false, 10),
  createSampleNote(12, "Dream Journal Entry", "Dreamt of flying over a vast ocean. Felt incredibly free and peaceful. Woke up feeling refreshed.", ['Personal'], false, 11),
  createSampleNote(13, "Learning React Native", "Components, State, Props, Hooks (useState, useEffect, useCallback, useMemo), Styling (StyleSheet), Navigation.", ['Study', 'Work'], false, 12, true),
  createSampleNote(14, "Gift Ideas for Birthday", "Smartwatch, noise-cancelling headphones, personalized mug, subscription box.", ['Personal', 'Shopping'], false, 13),
  createSampleNote(15, "Team Lunch Suggestions", "Italian, Mexican, Sushi, Burger joint. Vote for preferred cuisine by Tuesday.", ['Work', 'Meeting'], false, 14),
  createSampleNote(16, "Client Feedback - Website Redesign", "Positive feedback on new UI. Requested minor adjustments to contact form and hero section images.", ['Work', 'Project A'], true, 15),
  createSampleNote(17, "Daily Affirmations", "I am capable. I am strong. I am resilient. I attract success and abundance.", ['Personal', 'Health'], false, 16),
  createSampleNote(18, "Travel Plans - Europe", "Paris (3), Rome (4), Barcelona (3). Book flights and accommodations by next month.", ['Personal'], false, 17)
];


//  REUSABLE COMPONENTS 

const Header = ({ title, onBack, rightButton, rightButtonIcon, onRightButtonPress, showAddButton, onAddPress }) => {
  return (
    <LinearGradient
      colors={[Theme.surface, Theme.elevated]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.headerLeft}>
        {onBack && (
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBack(); }} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{'< Back'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        {showAddButton && (
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAddPress(); }} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{"\u2795"}</Text>
          </TouchableOpacity>
        )}
        {rightButton && (
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRightButtonPress(); }} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{rightButtonIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const TabBar = ({ activeTab, setActiveTab, starredCount, notificationCount }) => {
  const TabButton = ({ tabName, icon, count }) => (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setActiveTab(tabName); }}
    >
      <Text style={[styles.tabIcon, activeTab === tabName && { color: Theme.accent }]}>{icon}</Text>
      <Text style={[styles.tabLabel, activeTab === tabName && { color: Theme.accent }]}>{tabName}</Text>
      {count > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[Theme.elevated, Theme.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.tabBar}
    >
      <TabButton tabName="Home" icon="\u{1F3E0}" />
      <TabButton tabName="Notes" icon="\u{1F4CB}" />
      <TabButton tabName="Add Note" icon="\u2795" />
      <TabButton tabName="Starred" icon="\u2B50" count={starredCount} />
      <TabButton tabName="Profile" icon="\u{1F464}" />
    </LinearGradient>
  );
};

const NoteCard = ({ note, onPress, onStarToggle }) => {
  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress(note.id);
  }, [note.id, onPress]);

  const handleStarToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStarToggle(note.id);
  }, [note.id, onStarToggle]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.noteCard}>
      <View style={styles.noteCardContent}>
        <Text style={styles.noteCardTitle} numberOfLines={1}>{note.title}</Text>
        <Text style={styles.noteCardText} numberOfLines={2}>{note.content}</Text>
        <View style={styles.noteCardTags}>
          {note.tags.map((tag, index) => (
            <TagChip key={index} tag={tag} />
          ))}
        </View>
        <Text style={styles.noteCardDate}>{getTimeAgo(note.updatedAt)}</Text>
      </View>
      <TouchableOpacity onPress={handleStarToggle} style={styles.noteCardStar}>
        <Text style={styles.noteCardStarIcon}>{note.isStarred ? '\u2B50' : '\u2606'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const Button = ({ title, onPress, style, textStyle, primary, danger, disabled }) => {
  const buttonStyle = useMemo(() => [
    styles.button,
    primary && styles.buttonPrimary,
    danger && styles.buttonDanger,
    disabled && styles.buttonDisabled,
    style
  ], [primary, danger, disabled, style]);

  const buttonTextStyle = useMemo(() => [
    styles.buttonText,
    primary && styles.buttonTextPrimary,
    danger && styles.buttonTextDanger,
    disabled && styles.buttonTextDisabled,
    textStyle
  ], [primary, danger, disabled, textStyle]);

  return (
    <TouchableOpacity
      onPress={() => {
        if (!disabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }
      }}
      style={buttonStyle}
      disabled={disabled}
    >
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const TextInputField = ({ label, value, onChangeText, placeholder, multiline, style, ...props }) => {
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[styles.textInput, multiline && styles.multilineTextInput, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Theme.secondary}
        multiline={multiline}
        selectionColor={Theme.accent}
        {...props}
      />
    </View>
  );
};

const TagChip = ({ tag, onPress, selected, showRemove }) => {
  return (
    <TouchableOpacity
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(tag);
        }
      }}
      style={[styles.tagChip, selected && styles.tagChipSelected]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>{tag}</Text>
      {showRemove && (
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); showRemove(tag); }} style={styles.tagChipRemove}>
          <Text style={styles.tagChipRemoveText}>{"\u274C"}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const Toast = ({ message, type, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 150,
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
  }, [message, onDismiss, fadeAnim, slideAnim]);

  if (!message) return null;

  const backgroundColor = type === 'success' ? Theme.success : type === 'danger' ? Theme.danger : Theme.secondary;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        { backgroundColor }
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <View style={styles.modalButtonContainer}>
              <Button title={cancelText} onPress={onCancel} style={styles.modalButton} />
              <Button title={confirmText} onPress={onConfirm} danger style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const EmptyState = ({ message, icon, onRefresh, refreshText }) => {
  return (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>{icon}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
      {onRefresh && (
        <Button title={refreshText || "Refresh"} onPress={onRefresh} primary style={{ marginTop: 20 }} />
      )}
    </View>
  );
};

const SearchBar = ({ searchText, onSearchChange, onClearSearch, placeholder }) => {
  return (
    <View style={styles.searchBarContainer}>
      <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || "Search notes..."}
        placeholderTextColor={Theme.secondary}
        value={searchText}
        onChangeText={onSearchChange}
        selectionColor={Theme.accent}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClearSearch(); }} style={styles.clearSearchButton}>
          <Text style={styles.clearSearchIcon}>{"\u274C"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

//  SCREEN COMPONENTS 

const HomeScreen = ({ notes, goToNotesList, goToStarredList, goToCreateNote }) => {
  const recentNotes = useMemo(() => notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3), [notes]);
  const starredNotes = useMemo(() => notes.filter(note => note.isStarred).slice(0, 3), [notes]);
  const totalNotes = notes.length;
  const totalStarred = notes.filter(note => note.isStarred).length;
  const uniqueTags = useMemo(() => [...new Set(notes.flatMap(note => note.tags))], [notes]).length;

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.homeContentContainer}>
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={[Theme.elevated, Theme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{totalNotes}</Text>
          <Text style={styles.statLabel}>Total Notes</Text>
        </LinearGradient>
        <LinearGradient
          colors={[Theme.elevated, Theme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{totalStarred}</Text>
          <Text style={styles.statLabel}>Starred Notes</Text>
        </LinearGradient>
        <LinearGradient
          colors={[Theme.elevated, Theme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <Text style={styles.statValue}>{uniqueTags}</Text>
          <Text style={styles.statLabel}>Unique Tags</Text>
        </LinearGradient>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Notes</Text>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToNotesList(); }}>
          <Text style={styles.viewAllButton}>View All {"\u276F"}</Text>
        </TouchableOpacity>
      </View>
      {recentNotes.length > 0 ? (
        <FlatList
          data={recentNotes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => goToNotesList(item.id)}
              onStarToggle={() => {}} // Star toggle disabled on home screen for simplicity
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      ) : (
        <EmptyState message="No recent notes. Start creating!" icon="\u{1F4DD}" />
      )}

      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Starred Notes</Text>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToStarredList(); }}>
          <Text style={styles.viewAllButton}>View All {"\u276F"}</Text>
        </TouchableOpacity>
      </View>
      {starredNotes.length > 0 ? (
        <FlatList
          data={starredNotes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => goToNotesList(item.id)}
              onStarToggle={() => {}} // Star toggle disabled on home screen for simplicity
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      ) : (
        <EmptyState message="No starred notes yet. Mark your important notes!" icon="\u2606" />
      )}

      <Button title="Create New Note" primary onPress={goToCreateNote} style={{ margin: 16, marginTop: 30 }} />
    </ScrollView>
  );
};

const NotesScreen = ({ notes, setCurrentScreen, onStarToggle, showToast, showStarredOnly = false }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt', 'createdAt', 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = showStarredOnly ? notes.filter(note => note.isStarred) : notes;

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(lowerSearch) ||
        note.content.toLowerCase().includes(lowerSearch) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.every(selectedTag => note.tags.includes(selectedTag))
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        comparison = new Date(a[sortBy]) - new Date(b[sortBy]);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [notes, searchText, selectedTags, sortBy, sortOrder, showStarredOnly]);

  const handleSearchChange = useCallback(debounce((text) => setSearchText(text), 300), []);

  const handleTagPress = useCallback((tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      showToast("Notes refreshed!", 'success');
      setIsRefreshing(false);
    }, 1000); // Simulate network refresh
  }, [showToast]);

  const handleNotePress = useCallback((noteId) => {
    setCurrentScreen({ name: 'NoteDetail', params: { noteId } });
  }, [setCurrentScreen]);

  return (
    <View style={styles.screenContainer}>
      <SearchBar
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onClearSearch={() => setSearchText('')}
        placeholder={showStarredOnly ? "Search starred notes..." : "Search notes..."}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {allTags.map(tag => (
          <TagChip
            key={tag}
            tag={tag}
            onPress={handleTagPress}
            selected={selectedTags.includes(tag)}
          />
        ))}
      </ScrollView>

      <View style={styles.sortOptionsContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setSortBy('updatedAt'); setSortOrder(sortBy === 'updatedAt' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
          style={[styles.sortOption, sortBy === 'updatedAt' && styles.sortOptionSelected]}
        >
          <Text style={styles.sortOptionText}>Updated {sortBy === 'updatedAt' && (sortOrder === 'desc' ? '\u2193' : '\u2191')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setSortBy('createdAt'); setSortOrder(sortBy === 'createdAt' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
          style={[styles.sortOption, sortBy === 'createdAt' && styles.sortOptionSelected]}
        >
          <Text style={styles.sortOptionText}>Created {sortBy === 'createdAt' && (sortOrder === 'desc' ? '\u2193' : '\u2191')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setSortBy('title'); setSortOrder(sortBy === 'title' && sortOrder === 'asc' ? 'desc' : 'asc'); }}
          style={[styles.sortOption, sortBy === 'title' && styles.sortOptionSelected]}
        >
          <Text style={styles.sortOptionText}>Title {sortBy === 'title' && (sortOrder === 'asc' ? '\u2191' : '\u2193')}</Text>
        </TouchableOpacity>
      </View>

      {filteredAndSortedNotes.length === 0 ? (
        <EmptyState message="No notes found matching your criteria." icon="\u{1F4DD}" />
      ) : (
        <FlatList
          data={filteredAndSortedNotes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NoteCard note={item} onPress={handleNotePress} onStarToggle={onStarToggle} />
          )}
          contentContainerStyle={styles.notesList}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        />
      )}
    </View>
  );
};

const AddEditNoteScreen = ({ noteToEdit, onSave, onBack, showToast }) => {
  const [title, setTitle] = useState(noteToEdit ? noteToEdit.title : '');
  const [content, setContent] = useState(noteToEdit ? noteToEdit.content : '');
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [tags, setTags] = useState(noteToEdit ? noteToEdit.tags : []);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTag = useCallback(() => {
    if (currentTagInput.trim() && !tags.includes(currentTagInput.trim())) {
      setTags(prev => [...prev, currentTagInput.trim()]);
      setCurrentTagInput('');
    }
  }, [currentTagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      showToast('Title cannot be empty!', 'danger');
      return;
    }
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save
    onSave({
      id: noteToEdit ? noteToEdit.id : generateId(),
      title: title.trim(),
      content: content.trim(),
      tags: tags,
      isStarred: noteToEdit ? noteToEdit.isStarred : false,
      createdAt: noteToEdit ? noteToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachment: noteToEdit ? noteToEdit.attachment : null, // Keep existing attachment or null
    });
    showToast(noteToEdit ? 'Note updated successfully!' : 'Note created successfully!', 'success');
    setIsSaving(false);
    onBack();
  }, [title, content, tags, noteToEdit, onSave, onBack, showToast]);

  const handleAttachmentPress = useCallback(() => {
    showToast("Attachment feature coming soon!", 'warning');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [showToast]);

  const handleDrawingPress = useCallback(() => {
    showToast("Drawing feature coming soon!", 'warning');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [showToast]);

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.addEditScrollContainer}>
      <TextInputField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Note Title"
        maxLength={100}
      />
      <TextInputField
        label="Content"
        value={content}
        onChangeText={setContent}
        placeholder="Start writing your note here..."
        multiline
        style={styles.contentTextInput}
      />

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tags</Text>
        <View style={styles.tagsInputRow}>
          <TextInput
            style={styles.tagTextInput}
            value={currentTagInput}
            onChangeText={setCurrentTagInput}
            placeholder="Add a tag..."
            placeholderTextColor={Theme.secondary}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
            selectionColor={Theme.accent}
          />
          <Button title="Add" onPress={handleAddTag} primary style={styles.addTagButton} textStyle={styles.addTagButtonText} />
        </View>
        <View style={styles.currentTagsContainer}>
          {tags.length === 0 ? (
            <Text style={styles.mutedText}>No tags added yet.</Text>
          ) : (
            tags.map((tag, index) => (
              <TagChip key={index} tag={tag} showRemove={handleRemoveTag} />
            ))
          )}
        </View>
      </View>

      <View style={styles.featureButtonsContainer}>
        <Button title="\u{1F4F7} Add Attachment" onPress={handleAttachmentPress} style={styles.featureButton} />
        <Button title="\u270F Drawing" onPress={handleDrawingPress} style={styles.featureButton} />
      </View>

      <Button
        title={isSaving ? "Saving..." : (noteToEdit ? "Update Note" : "Create Note")}
        onPress={handleSave}
        primary
        style={styles.saveButton}
        disabled={isSaving}
      />
    </ScrollView>
  );
};

const NoteDetailScreen = ({ note, onBack, onDelete, onEdit, onStarToggle, showToast }) => {
  const handleDeleteConfirm = useCallback(() => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.selectionAsync() },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            onDelete(note.id);
            showToast('Note deleted successfully!', 'danger');
            onBack();
          }
        }
      ],
      { cancelable: true }
    );
  }, [note.id, onDelete, onBack, showToast]);

  const handleShare = useCallback(() => {
    showToast("Sharing feature coming soon!", 'warning');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [showToast]);

  const handleCollaborate = useCallback(() => {
    showToast("Real-time collaboration feature coming soon!", 'warning');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [showToast]);

  if (!note) {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.errorText}>Note not found.</Text>
        <Button title="Go Back" onPress={onBack} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.detailScrollContainer}>
      <Text style={styles.detailTitle}>{note.title}</Text>
      <View style={styles.detailMeta}>
        <Text style={styles.detailDate}>Created: {formatDate(note.createdAt)}</Text>
        <Text style={styles.detailDate}>Updated: {getTimeAgo(note.updatedAt)}</Text>
      </View>

      <View style={styles.detailTagsContainer}>
        {note.tags.length > 0 ? (
          note.tags.map((tag, index) => <TagChip key={index} tag={tag} />)
        ) : (
          <Text style={styles.mutedText}>No tags</Text>
        )}
      </View>

      <Text style={styles.detailContent}>{note.content}</Text>

      {note.attachment && (
        <View style={styles.attachmentContainer}>
          <Text style={styles.attachmentLabel}>Attachment:</Text>
          <Image source={{ uri: note.attachment.uri }} style={styles.attachmentImage} resizeMode="cover" />
          <Text style={styles.attachmentText}>Image Attachment</Text>
        </View>
      )}

      <View style={styles.detailActionButtons}>
        <Button title={note.isStarred ? "\u2B50 Unstar" : "\u2606 Star"} onPress={() => onStarToggle(note.id)} style={styles.detailActionButton} />
        <Button title="\u270F Edit" onPress={() => onEdit(note.id)} style={styles.detailActionButton} primary />
        <Button title="\u{1F4E4} Share" onPress={handleShare} style={styles.detailActionButton} />
        <Button title="\u{1F4AC} Collaborate" onPress={handleCollaborate} style={styles.detailActionButton} />
        <Button title="\u{1F5D1} Delete" onPress={handleDeleteConfirm} style={styles.detailActionButton} danger />
      </View>
    </ScrollView>
  );
};

const ProfileScreen = ({ settings, setSettings, showToast, onBack }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleSetting = useCallback((key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    Haptics.selectionAsync();
  }, [setSettings]);

  const handleSyncNow = useCallback(() => {
    setIsSyncing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Info);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Notes synced to cloud!', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000); // Simulate sync
  }, [showToast]);

  const handleFeedback = useCallback(() => {
    Linking.openURL('mailto:support@notepadd.com');
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://notepadd.com/privacy');
  }, []);

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.profileScrollContainer}>
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>General Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            trackColor={{ false: Theme.muted, true: Theme.accent }}
            thumbColor={settings.darkMode ? Theme.text : Theme.secondary}
            ios_backgroundColor={Theme.muted}
            onValueChange={() => handleToggleSetting('darkMode')}
            value={settings.darkMode}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Haptic Feedback</Text>
          <Switch
            trackColor={{ false: Theme.muted, true: Theme.accent }}
            thumbColor={settings.hapticFeedback ? Theme.text : Theme.secondary}
            ios_backgroundColor={Theme.muted}
            onValueChange={() => handleToggleSetting('hapticFeedback')}
            value={settings.hapticFeedback}
          />
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Cloud Sync & Backup</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto Sync</Text>
          <Switch
            trackColor={{ false: Theme.muted, true: Theme.accent }}
            thumbColor={settings.autoSync ? Theme.text : Theme.secondary}
            ios_backgroundColor={Theme.muted}
            onValueChange={() => handleToggleSetting('autoSync')}
            value={settings.autoSync}
          />
        </View>
        <Button
          title={isSyncing ? "Syncing..." : "\u{1F504} Sync Notes Now"}
          onPress={handleSyncNow}
          primary
          disabled={isSyncing}
          style={{ marginTop: 10 }}
        />
        {isSyncing && <ActivityIndicator color={Theme.accent} style={{ marginTop: 10 }} />}
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>About & Support</Text>
        <TouchableOpacity style={styles.aboutItem} onPress={handleFeedback}>
          <Text style={styles.aboutItemText}>Send Feedback {"\u276F"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aboutItem} onPress={handlePrivacyPolicy}>
          <Text style={styles.aboutItemText}>Privacy Policy {"\u276F"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aboutItem} onPress={() => Alert.alert('Version', 'Notepad App v1.0.0')}>
          <Text style={styles.aboutItemText}>App Version {"\u276F"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

//  MAIN APP 
const App = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [currentScreen, setCurrentScreen] = useState(null); // { name: 'ScreenName', params: {} }
  const [notes, setNotes] = useState([]);
  const [settings, setSettings] = useState({
    darkMode: false,
    hapticFeedback: true,
    autoSync: true
  });
  const [toast, setToast] = useState({ message: '', type: '' });
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load data from AsyncStorage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem('notes');
        const storedSettings = await AsyncStorage.getItem('settings');
        if (storedNotes) setNotes(JSON.parse(storedNotes));
        else setNotes(initialNotes); // Use sample data if none stored
        if (storedSettings) setSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Failed to load data:", e);
        setNotes(initialNotes); // Fallback to sample data
      }
    };
    loadData();
  }, []);

  // Save notes to AsyncStorage whenever they change
  useEffect(() => {
    const saveNotes = async () => {
      try {
        await AsyncStorage.setItem('notes', JSON.stringify(notes));
      } catch (e) {
        console.error("Failed to save notes:", e);
      }
    };
    if (notes.length > 0) saveNotes(); // Only save if notes are populated
  }, [notes]);

  // Save settings to AsyncStorage whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
      } catch (e) {
        console.error("Failed to save settings:", e);
      }
    };
    saveSettings();
  }, [settings]);

  // Screen transition animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true
    }).start();
    return () => {
      fadeAnim.setValue(0); // Reset for next transition
    };
  }, [currentScreen, activeTab, fadeAnim]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast({ message: '', type: '' });
  }, []);

  const handleAddOrUpdateNote = useCallback((newNote) => {
    setNotes(prevNotes => {
      const existingIndex = prevNotes.findIndex(note => note.id === newNote.id);
      if (existingIndex > -1) {
        const updatedNotes = [...prevNotes];
        updatedNotes[existingIndex] = newNote;
        return updatedNotes;
      } else {
        return [...prevNotes, newNote];
      }
    });
  }, []);

  const handleDeleteNote = useCallback((noteId) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  }, []);

  const handleStarToggle = useCallback((noteId) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isStarred: !note.isStarred, updatedAt: new Date().toISOString() } : note
      )
    );
    const starredNote = notes.find(n => n.id === noteId);
    showToast(starredNote && !starredNote.isStarred ? 'Note unstarred!' : 'Note starred!', 'success');
  }, [notes, showToast]);

  const navigateToDetail = useCallback((noteId) => {
    setCurrentScreen({ name: 'NoteDetail', params: { noteId } });
  }, []);

  const navigateToEdit = useCallback((noteId) => {
    setCurrentScreen({ name: 'AddEditNote', params: { noteId, isEdit: true } });
  }, []);

  const goBack = useCallback(() => {
    setCurrentScreen(null);
  }, []);

  const renderScreen = () => {
    if (currentScreen) {
      const { name, params } = currentScreen;
      const noteToPass = params && params.noteId ? notes.find(n => n.id === params.noteId) : null;

      switch (name) {
        case 'NoteDetail':
          return (
            <NoteDetailScreen
              note={noteToPass}
              onBack={goBack}
              onDelete={handleDeleteNote}
              onEdit={navigateToEdit}
              onStarToggle={handleStarToggle}
              showToast={showToast}
            />
          );
        case 'AddEditNote':
          return (
            <AddEditNoteScreen
              noteToEdit={params.isEdit ? noteToPass : null}
              onSave={handleAddOrUpdateNote}
              onBack={goBack}
              showToast={showToast}
            />
          );
        default:
          return <Text style={styles.errorText}>Unknown screen: {name}</Text>;
      }
    }

    switch (activeTab) {
      case 'Home':
        return (
          <HomeScreen
            notes={notes}
            goToNotesList={() => setActiveTab('Notes')}
            goToStarredList={() => setActiveTab('Starred')}
            goToCreateNote={() => setActiveTab('Add Note')}
          />
        );
      case 'Notes':
        return (
          <NotesScreen
            notes={notes}
            setCurrentScreen={setCurrentScreen}
            onStarToggle={handleStarToggle}
            showToast={showToast}
          />
        );
      case 'Add Note':
        return (
          <AddEditNoteScreen
            onSave={(note) => {
              handleAddOrUpdateNote(note);
              setActiveTab('Notes'); // Go to notes list after adding
            }}
            onBack={() => setActiveTab('Notes')}
            showToast={showToast}
          />
        );
      case 'Starred':
        return (
          <NotesScreen
            notes={notes}
            setCurrentScreen={setCurrentScreen}
            onStarToggle={handleStarToggle}
            showStarredOnly={true}
            showToast={showToast}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            settings={settings}
            setSettings={setSettings}
            showToast={showToast}
            onBack={goBack}
          />
        );
      default:
        return <Text style={styles.errorText}>Welcome to Notepad App!</Text>;
    }
  };

  const getHeaderTitle = () => {
    if (currentScreen) {
      switch (currentScreen.name) {
        case 'NoteDetail': return notes.find(n => n.id === currentScreen.params.noteId)?.title || 'Note Details';
        case 'AddEditNote': return currentScreen.params.isEdit ? 'Edit Note' : 'Create Note';
        default: return 'Notepad';
      }
    }
    switch (activeTab) {
      case 'Home': return 'Dashboard';
      case 'Notes': return 'All Notes';
      case 'Add Note': return 'Create Note';
      case 'Starred': return 'Starred Notes';
      case 'Profile': return 'Settings & Profile';
      default: return 'Notepad';
    }
  };

  const starredCount = useMemo(() => notes.filter(note => note.isStarred).length, [notes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={Theme.surface} />
      <Header
        title={getHeaderTitle()}
        onBack={currentScreen ? goBack : null}
        showAddButton={activeTab !== 'Add Note' && !currentScreen}
        onAddPress={() => setActiveTab('Add Note')}
      />
      <Animated.View style={[styles.screenContent, { opacity: fadeAnim }]}>
        {renderScreen()}
      </Animated.View>
      <TabBar
        activeTab={activeTab}
        setActiveTab={setCurrentScreen ? goBack : setActiveTab} // Go back if on sub-screen, else change tab
        starredCount={starredCount}
        notificationCount={0} // Placeholder for future notifications
      />
      <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
    </SafeAreaView>
  );
};

//  STYLES 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.background
  },
  screenContent: {
    flex: 1,
    backgroundColor: Theme.background
  },
  screenContainer: {
    flex: 1,
    backgroundColor: Theme.background
  },
  homeContentContainer: {
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.elevated
  },
  headerLeft: {
    width: 80,
    justifyContent: 'flex-start'
  },
  headerRight: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.text,
    flexShrink: 1,
    textAlign: 'center'
  },
  headerButton: {
    padding: 8
  },
  headerButtonText: {
    color: Theme.accent,
    fontSize: 16,
    fontWeight: '600'
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.elevated,
    height: Platform.OS === 'ios' ? 90 : 60, // Accommodate iPhone X notch
    paddingBottom: Platform.OS === 'ios' ? 25 : 0
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 5
  },
  tabIcon: {
    fontSize: 24,
    color: Theme.secondary,
    marginBottom: 2
  },
  tabLabel: {
    fontSize: 10,
    color: Theme.secondary,
    fontWeight: '600'
  },
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: 15,
    backgroundColor: Theme.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabBadgeText: {
    color: Theme.text,
    fontSize: 10,
    fontWeight: 'bold'
  },
  notesList: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  noteCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Theme.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
      },
      android: {
        elevation: 3
      }
    }),
    width: screenWidth * 0.85, // For horizontal list
    marginRight: 12, // For horizontal list
  },
  noteCardContent: {
    flex: 1,
    marginRight: 10
  },
  noteCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 4
  },
  noteCardText: {
    fontSize: 14,
    color: Theme.secondary,
    marginBottom: 8
  },
  noteCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  noteCardDate: {
    fontSize: 12,
    color: Theme.muted
  },
  noteCardStar: {
    padding: 8
  },
  noteCardStarIcon: {
    fontSize: 22,
    color: Theme.accent
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.elevated
  },
  buttonPrimary: {
    backgroundColor: Theme.accent
  },
  buttonDanger: {
    backgroundColor: Theme.danger
  },
  buttonDisabled: {
    backgroundColor: Theme.muted
  },
  buttonText: {
    color: Theme.text,
    fontSize: 16,
    fontWeight: '600'
  },
  buttonTextPrimary: {
    color: Theme.background
  },
  buttonTextDanger: {
    color: Theme.text
  },
  buttonTextDisabled: {
    color: Theme.secondary
  },
  inputContainer: {
    marginBottom: 16,
    paddingHorizontal: 16
  },
  inputLabel: {
    fontSize: 14,
    color: Theme.secondary,
    marginBottom: 8,
    fontWeight: '500'
  },
  textInput: {
    backgroundColor: Theme.elevated,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
    borderWidth: 1,
    borderColor: Theme.surface
  },
  multilineTextInput: {
    minHeight: 120,
    textAlignVertical: 'top'
  },
  contentTextInput: {
    minHeight: 200
  },
  tagChip: {
    backgroundColor: Theme.muted,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  tagChipSelected: {
    backgroundColor: Theme.accent
  },
  tagChipText: {
    color: Theme.text,
    fontSize: 13,
    fontWeight: '500'
  },
  tagChipTextSelected: {
    color: Theme.background
  },
  tagChipRemove: {
    marginLeft: 6,
    paddingLeft: 4
  },
  tagChipRemoveText: {
    color: Theme.text,
    fontSize: 12,
    fontWeight: 'bold'
  },
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 70,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: Theme.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
      },
      android: {
        elevation: 5
      }
    })
  },
  toastText: {
    color: Theme.text,
    fontSize: 15,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCenteredView: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalView: {
    backgroundColor: Theme.elevated,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    margin: 20,
    ...Platform.select({
      ios: {
        shadowColor: Theme.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4
      },
      android: {
        elevation: 5
      }
    })
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 15
  },
  modalMessage: {
    fontSize: 16,
    color: Theme.secondary,
    textAlign: 'center',
    marginBottom: 20
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 10
  },
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
    fontSize: 16,
    color: Theme.secondary,
    textAlign: 'center',
    lineHeight: 24
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.elevated,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.surface
  },
  searchIcon: {
    fontSize: 20,
    color: Theme.secondary,
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: Theme.text
  },
  clearSearchButton: {
    padding: 8
  },
  clearSearchIcon: {
    fontSize: 18,
    color: Theme.muted
  },
  filterBar: {
    paddingHorizontal: 16,
    marginBottom: 10
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  sortLabel: {
    fontSize: 14,
    color: Theme.secondary,
    marginRight: 10
  },
  sortOption: {
    backgroundColor: Theme.elevated,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.surface
  },
  sortOptionSelected: {
    backgroundColor: Theme.accent,
    borderColor: Theme.accent
  },
  sortOptionText: {
    color: Theme.text,
    fontSize: 13,
    fontWeight: '500'
  },
  addEditScrollContainer: {
    paddingBottom: 20
  },
  tagsInputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tagTextInput: {
    flex: 1,
    backgroundColor: Theme.elevated,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
    borderWidth: 1,
    borderColor: Theme.surface,
    marginRight: 10
  },
  addTagButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8
  },
  addTagButtonText: {
    fontSize: 14
  },
  currentTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  mutedText: {
    color: Theme.muted,
    fontSize: 14
  },
  featureButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 10
  },
  featureButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: Theme.elevated,
    borderColor: Theme.accent,
    borderWidth: 1
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 20
  },
  detailScrollContainer: {
    padding: 16,
    paddingBottom: 30
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: 10
  },
  detailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  detailDate: {
    fontSize: 13,
    color: Theme.muted
  },
  detailTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surface,
    paddingBottom: 15
  },
  detailContent: {
    fontSize: 16,
    color: Theme.secondary,
    lineHeight: 24,
    marginBottom: 20
  },
  attachmentContainer: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20
  },
  attachmentLabel: {
    fontSize: 14,
    color: Theme.muted,
    marginBottom: 10
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10
  },
  attachmentText: {
    fontSize: 14,
    color: Theme.text,
    fontWeight: 'bold'
  },
  detailActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10
  },
  detailActionButton: {
    margin: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 100
  },
  errorText: {
    color: Theme.danger,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 10
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    ...Platform.select({
      ios: {
        shadowColor: Theme.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3
      },
      android: {
        elevation: 2
      }
    })
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.accent,
    marginBottom: 5
  },
  statLabel: {
    fontSize: 13,
    color: Theme.secondary,
    textAlign: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.text
  },
  viewAllButton: {
    color: Theme.accent,
    fontSize: 14,
    fontWeight: '600'
  },
  profileScrollContainer: {
    paddingBottom: 30
  },
  profileSection: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: Theme.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
      },
      android: {
        elevation: 3
      }
    })
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.elevated
  },
  settingLabel: {
    fontSize: 16,
    color: Theme.text
  },
  aboutItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.elevated
  },
  aboutItemText: {
    fontSize: 16,
    color: Theme.secondary
  }
});

export default App;