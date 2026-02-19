import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, StatusBar, FlatList, Modal, Alert, Animated, ScrollView, Image, Dimensions, Switch, Platform, ActivityIndicator, Pressable, SectionList, Linking } from 'react-native';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

//  UTILITY FUNCTIONS 
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
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

//  SAMPLE DATA 
const initialNotes = [
  { id: generateId(), title: "Meeting Notes - Project Alpha", content: "Discussed Q3 strategy, assigned tasks to John and Sarah. Need to follow up on budget review by Friday. Key takeaways: focus on market penetration.", tags: ["work", "project", "meeting"], createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Grocery List", content: "Milk, Eggs, Bread, Butter, Apples, Bananas, Spinach, Chicken Breast, Pasta, Tomato Sauce, Cheese. Don't forget the dark chocolate!", tags: ["personal", "shopping"], createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), isFavorite: true, isProtected: false, password: '' },
  { id: generateId(), title: "Travel Itinerary - Europe", content: "Day 1: Arrive Paris, Eiffel Tower. Day 2: Louvre, Notre Dame. Day 3: Train to Rome. Day 4: Colosseum, Vatican. Day 5: Fly to Barcelona. Day 6: Sagrada Familia. Book flights and hotels by end of month.", tags: ["travel", "personal"], createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), isFavorite: true, isProtected: false, password: '' },
  { id: generateId(), title: "Ideas for New App Feature", content: "User profiles, dark mode toggle, offline access, real-time sync, collaborative editing. Consider integrating AI for content suggestions.", tags: ["work", "ideas", "tech"], createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Financial Goals 2024", content: "Save 15% of income, invest in mutual funds, pay off credit card debt, create emergency fund. Review budget quarterly.", tags: ["personal", "finance"], createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(), isFavorite: false, isProtected: true, password: '123' }, // Protected note
  { id: generateId(), title: "Book Recommendations", content: "Sapiens by Yuval Noah Harari, The Alchemist by Paulo Coelho, 1984 by George Orwell, Educated by Tara Westover.", tags: ["personal", "books"], createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(), isFavorite: true, isProtected: false, password: '' },
  { id: generateId(), title: "Workout Plan - Week 1", content: "Monday: Chest & Triceps. Tuesday: Back & Biceps. Wednesday: Legs & Shoulders. Thursday: Rest. Friday: Full Body. Saturday/Sunday: Cardio/Active Recovery.", tags: ["health", "fitness"], createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Recipe: Spicy Lentil Soup", content: "Ingredients: Red lentils, carrots, celery, onion, garlic, vegetable broth, diced tomatoes, chili powder, cumin, turmeric. Instructions: Sauté veggies, add spices, lentils, broth. Simmer until tender.", tags: ["personal", "recipe"], createdAt: new Date(Date.now() - 3600000 * 24 * 9).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 9).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Client Feedback - Website Redesign", content: "Client liked the new color scheme but requested changes to the navigation menu. Also, improve mobile responsiveness on tablet devices. Schedule follow-up meeting.", tags: ["work", "client"], createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), modifiedAt: new Date().toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Weekend Plans", content: "Saturday: Farmer's market in the morning, hike in the afternoon. Sunday: Brunch with friends, movie night. Don't forget to call mom!", tags: ["personal", "social"], createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), isFavorite: true, isProtected: false, password: '' },
  { id: generateId(), title: "Password Reminders (Highly Sensitive!)", content: "Bank PIN: 1234, Email password hint: First pet's name. \n\nTHIS IS A SAMPLE. DO NOT STORE REAL PASSWORDS HERE.", tags: ["security", "sensitive"], createdAt: new Date(Date.now() - 3600000 * 24 * 25).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(), isFavorite: false, isProtected: true, password: 'securepassword' }, // Another protected note
  { id: generateId(), title: "Learning React Native - Roadmap", content: "Week 1: Basics, Components, Props, State. Week 2: Hooks, Navigation. Week 3: API Calls, Styling. Week 4: Advanced Components, Deployment. Practice daily!", tags: ["education", "tech"], createdAt: new Date(Date.now() - 3600000 * 24 * 18).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Gift Ideas for Birthday", content: "For Sarah: new book, nice pen, plant. For Tom: headphones, gaming mouse, coffee beans. For parents: spa day voucher, dinner reservation.", tags: ["personal", "gifts"], createdAt: new Date(Date.now() - 3600000 * 24 * 11).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 11).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Home Renovation Ideas", content: "Kitchen: new countertops, island. Bathroom: walk-in shower, double vanity. Living Room: built-in shelves, new paint color. Get quotes from contractors.", tags: ["home", "project"], createdAt: new Date(Date.now() - 3600000 * 24 * 22).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Quick Brainstorm: Marketing Slogans", content: "Catchy phrases: 'Your Ideas, Organized', 'Notes Made Simple', 'Unlock Your Thoughts'. Focus on simplicity and efficiency.", tags: ["work", "marketing", "ideas"], createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), isFavorite: true, isProtected: false, password: '' },
  { id: generateId(), title: "Dental Appointment Details", content: "Dr. Smith, 10:00 AM, Tuesday next week. Remember to bring insurance card. Location: 123 Main St.", tags: ["personal", "appointment"], createdAt: new Date(Date.now() - 3600000 * 24 * 13).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 13).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Car Maintenance Checklist", content: "Oil change (every 5k miles), tire rotation, brake check, fluid levels, air filter. Schedule for next month.", tags: ["car", "maintenance"], createdAt: new Date(Date.now() - 3600000 * 24 * 16).toISOString(), modifiedAt: new Date(Date.now() - 3600000 * 24 * 16).toISOString(), isFavorite: false, isProtected: false, password: '' },
  { id: generateId(), title: "Dream Journal Entry", content: "Dreamed I was flying over a vast ocean, saw a shimmering city below. Felt incredibly free and peaceful. Woke up feeling refreshed.", tags: ["personal", "dreams"], createdAt: new Date(Date.now() - 3600000 * 24 * 0.5).toISOString(), modifiedAt: new Date().toISOString(), isFavorite: false, isProtected: false, password: '' }
];


//  REUSABLE COMPONENTS 

const CustomButton = ({ title, onPress, style, textStyle, icon, color = Theme.accent, textColor = Theme.background }) => {
  const animatedScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(animatedScale, {
      toValue: 0.95,
      useNativeDriver: true
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(animatedScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color },
        style,
        { transform: [{ scale: animatedScale }] }
      ]}
    >
      {icon && <Text style={[styles.buttonIcon, { color: textColor }]}>{icon}</Text>}
      <Text style={[styles.buttonText, { color: textColor }, textStyle]}>{title}</Text>
    </Pressable>
  );
};

const Header = ({ title, onBackPress, rightActions, showBackButton = true }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [title]);

  return (
    <Animated.View style={[styles.header, { opacity: animatedOpacity }]}>
      <View style={styles.headerLeft}>
        {showBackButton && onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{"\u2190"}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.headerRight}>
        {rightActions && rightActions.map((action, index) => (
          <TouchableOpacity key={index} onPress={action.onPress} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{action.icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const Card = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const SearchBar = ({ searchText, onSearchChange, onSearchClear, placeholder = "Search notes..." }) => {
  return (
    <View style={styles.searchContainer}>
      <Text style={styles.searchIcon}>{"\u{1F50D}"}</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={Theme.secondary}
        value={searchText}
        onChangeText={onSearchChange}
        keyboardAppearance="dark"
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={onSearchClear} style={styles.searchClearButton}>
          <Text style={styles.searchClearButtonText}>{"\u274C"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const FilterChip = ({ label, isSelected, onPress, icon }) => {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isSelected && { backgroundColor: Theme.accent }]}
      onPress={onPress}
    >
      {icon && <Text style={[styles.filterChipIcon, isSelected ? { color: Theme.background } : { color: Theme.text }]}>{icon}</Text>}
      <Text style={[styles.filterChipText, isSelected ? { color: Theme.background } : { color: Theme.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const EmptyState = ({ icon, message, ctaText, onCtaPress }) => (
  <View style={styles.emptyStateContainer}>
    <Text style={styles.emptyStateIcon}>{icon}</Text>
    <Text style={styles.emptyStateMessage}>{message}</Text>
    {ctaText && onCtaPress && (
      <CustomButton title={ctaText} onPress={onCtaPress} style={{ marginTop: 20 }} />
    )}
  </View>
);

const Toast = ({ message, type, visible, onDismiss }) => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animatedOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(animatedTranslateY, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(animatedOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(animatedTranslateY, { toValue: 50, duration: 300, useNativeDriver: true })
          ]).start(() => onDismiss());
        }, 3000);
      });
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? Theme.success : type === 'danger' ? Theme.danger : Theme.secondary;

  return (
    <Animated.View style={[styles.toastContainer, { backgroundColor, opacity: animatedOpacity, transform: [{ translateY: animatedTranslateY }] }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const ToggleSwitch = ({ label, value, onValueChange, style }) => (
  <View style={[styles.toggleSwitchContainer, style]}>
    <Text style={styles.toggleSwitchLabel}>{label}</Text>
    <Switch
      trackColor={{ false: Theme.muted, true: Theme.accent }}
      thumbColor={value ? Theme.background : Theme.text}
      ios_backgroundColor={Theme.muted}
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const PasswordInput = ({ value, onChangeText, placeholder, style, secureTextEntry, onToggleSecureEntry }) => {
  return (
    <View style={[styles.passwordInputContainer, style]}>
      <TextInput
        style={styles.passwordInputField}
        placeholder={placeholder}
        placeholderTextColor={Theme.secondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardAppearance="dark"
      />
      <TouchableOpacity onPress={onToggleSecureEntry} style={styles.passwordToggle}>
        <Text style={styles.passwordToggleIcon}>{secureTextEntry ? "\u{1F441}\u{FE0F}" : "\u{1F441}\u{FE0F}\u200D\u{1F5E1}\u{FE0F}"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", confirmColor = Theme.danger }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmationModalContent}>
          <Text style={styles.confirmationModalTitle}>{title}</Text>
          <Text style={styles.confirmationModalMessage}>{message}</Text>
          <View style={styles.confirmationModalButtons}>
            <CustomButton title={cancelText} onPress={onCancel} color={Theme.surface} textColor={Theme.text} style={{ flex: 1, marginRight: 10 }} />
            <CustomButton title={confirmText} onPress={onConfirm} color={confirmColor} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};


//  SCREEN COMPONENTS 

const HomeScreen = ({ notes, setCurrentScreen, setSelectedNoteId }) => {
  const recentNotes = useMemo(() => {
    return notes
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
      .slice(0, 5);
  }, [notes]);

  const totalNotes = notes.length;
  const favoriteNotesCount = notes.filter(note => note.isFavorite).length;
  const protectedNotesCount = notes.filter(note => note.isProtected).length;

  const handleViewNote = useCallback((noteId) => {
    setSelectedNoteId(noteId);
    setCurrentScreen('noteDetail');
  }, [setCurrentScreen, setSelectedNoteId]);

  return (
    <ScrollView style={styles.screenContainer} contentContainerStyle={styles.homeScrollViewContent}>
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Notes</Text>
          <Text style={styles.statValue}>{totalNotes}</Text>
          <Text style={styles.statIcon}>{"\u{1F4DD}"}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Favorites</Text>
          <Text style={styles.statValue}>{favoriteNotesCount}</Text>
          <Text style={styles.statIcon}>{"\u2764"}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Protected</Text>
          <Text style={styles.statValue}>{protectedNotesCount}</Text>
          <Text style={styles.statIcon}>{"\u{1F512}"}</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Recent Notes</Text>
      {recentNotes.length === 0 ? (
        <EmptyState
          icon={"\u{1F4D6}"}
          message="No recent notes. Start by creating one!"
          ctaText="Create New Note"
          onCtaPress={() => setCurrentScreen('addNote')}
        />
      ) : (
        <View style={styles.recentNotesList}>
          {recentNotes.map(note => (
            <TouchableOpacity key={note.id} onPress={() => handleViewNote(note.id)} style={styles.recentNoteItem}>
              <Card style={styles.recentNoteCard}>
                <Text style={styles.recentNoteTitle} numberOfLines={1}>{note.title}</Text>
                <Text style={styles.recentNoteContent} numberOfLines={2}>{note.isProtected ? "Protected Note \u{1F512}" : note.content}</Text>
                <View style={styles.recentNoteFooter}>
                  <Text style={styles.recentNoteDate}>{getTimeAgo(note.modifiedAt)}</Text>
                  {note.isFavorite && <Text style={styles.favoriteIconSmall}>{"\u2764"}</Text>}
                  {note.isProtected && <Text style={styles.protectedIconSmall}>{"\u{1F512}"}</Text>}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <CustomButton
          title="Create Note"
          icon={"\u2795"}
          onPress={() => setCurrentScreen('addNote')}
          style={styles.quickActionButton}
          textColor={Theme.background}
          color={Theme.accent}
        />
        <CustomButton
          title="View All Notes"
          icon={"\u{1F4DD}"}
          onPress={() => setCurrentScreen('notes')}
          style={styles.quickActionButton}
          textColor={Theme.text}
          color={Theme.surface}
        />
      </View>
    </ScrollView>
  );
};


const NotesListScreen = ({ notes, setCurrentScreen, setSelectedNoteId, onToggleFavorite, onRefreshNotes }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterProtected, setFilterProtected] = useState(false);
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [sortBy, setSortBy] = useState('modifiedAt'); // 'modifiedAt', 'createdAt', 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const animatedRefresh = useRef(new Animated.Value(0)).current;

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    animatedRefresh.setValue(0);
    Animated.timing(animatedRefresh, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start(() => {
      onRefreshNotes(); // Simulate data refresh
      setTimeout(() => setIsRefreshing(false), 500);
    });
  }, [onRefreshNotes]);

  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const toggleTag = useCallback((tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchText.toLowerCase()) ||
                            note.content.toLowerCase().includes(searchText.toLowerCase()) ||
                            note.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => note.tags.includes(tag));
      const matchesProtected = !filterProtected || note.isProtected;
      const matchesFavorite = !filterFavorite || note.isFavorite;
      return matchesSearch && matchesTags && matchesProtected && matchesFavorite;
    });

    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else { // modifiedAt or createdAt
        valA = new Date(a[sortBy]);
        valB = new Date(b[sortBy]);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
    return filtered;
  }, [notes, searchText, selectedTags, filterProtected, filterFavorite, sortBy, sortOrder]);

  const handleNotePress = useCallback((noteId) => {
    setSelectedNoteId(noteId);
    setCurrentScreen('noteDetail');
  }, [setCurrentScreen, setSelectedNoteId]);

  const renderNoteItem = useCallback(({ item: note }) => (
    <TouchableOpacity onPress={() => handleNotePress(note.id)} style={styles.noteListItem}>
      <Card style={styles.noteListCard}>
        <View style={styles.noteListHeader}>
          <Text style={styles.noteListTitle} numberOfLines={1}>{note.title}</Text>
          {note.isProtected && <Text style={styles.protectedIconSmall}>{"\u{1F512}"}</Text>}
          <TouchableOpacity onPress={() => onToggleFavorite(note.id)} style={styles.noteListFavoriteButton}>
            <Text style={styles.favoriteIcon}>{note.isFavorite ? "\u2764" : "\u2661"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.noteListContent} numberOfLines={2}>{note.isProtected ? "Protected Note. Tap to unlock." : note.content}</Text>
        <View style={styles.noteListTags}>
          {note.tags.map((tag, index) => (
            <View key={index} style={styles.noteListTag}>
              <Text style={styles.noteListTagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.noteListDate}>Modified: {getTimeAgo(note.modifiedAt)}</Text>
      </Card>
    </TouchableOpacity>
  ), [handleNotePress, onToggleFavorite]);

  const rotation = animatedRefresh.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
}