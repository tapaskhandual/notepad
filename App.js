import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, FlatList, Modal, Alert, Animated, ScrollView, Image, Dimensions, Switch, Platform, ActivityIndicator, Pressable, SectionList, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
};

const debounce = (func, delay) => {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};

const simulateAsyncOperation = async (delay = 1000) => {
    return new Promise(resolve => setTimeout(resolve, delay));
};

//  SAMPLE DATA 
const sampleNotes = [
    {
        id: 'note1',
        title: 'Meeting Notes - Project Alpha',
        content: 'Discussed Q3 strategy, budget allocation, and team roles. Action items: John to follow up on marketing, Sarah to prepare financial report. Next meeting: Friday 10 AM.',
        tags: ['work', 'project', 'meeting'],
        color: '#FF6347', // Tomato
        isFavorite: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 ago
        updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note2',
        title: 'Grocery List',
        content: 'Milk, Eggs, Bread, Cheese, Apples, Bananas, Spinach, Chicken Breast, Pasta. Don\'t forget the chocolate!',
        tags: ['personal', 'shopping'],
        color: '#3CB371', // MediumSeaGreen
        isFavorite: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note3',
        title: 'Ideas for new app feature',
        content: 'User authentication with biometric login. Real-time collaboration on notes. Offline mode with sync. Dark mode toggle. Markdown support for rich text. Ability to embed YouTube videos.',
        tags: ['ideas', 'development', 'app'],
        color: '#6A5ACD', // SlateBlue
        isFavorite: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        media: [
            { type: 'image', uri: 'https://picsum.photos/id/237/200/200' }, // Placeholder image
            { type: 'audio', uri: 'audio_idea_recording.mp3' } // Placeholder audio
        ]
    },
    {
        id: 'note4',
        title: 'Workout Plan - Week 3',
        content: 'Monday: Chest & Triceps. Tuesday: Back & Biceps. Wednesday: Legs & Shoulders. Thursday: Cardio. Friday: Full Body. Weekend: Rest.',
        tags: ['health', 'fitness'],
        color: '#FFD700', // Gold
        isFavorite: false,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 ago
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note5',
        title: 'Book Recommendations',
        content: 'The Martian by Andy Weir, Project Hail Mary by Andy Weir, Dune by Frank Herbert, Sapiens by Yuval Noah Harari.',
        tags: ['books', 'reading'],
        color: '#DA70D6', // Orchid
        isFavorite: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 ago
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note6',
        title: 'Travel Plans - Japan Trip',
        content: 'Tokyo: Shibuya, Shinjuku, Akihabara. Kyoto: Fushimi Inari, Arashiyama Bamboo Grove. Osaka: Dotonbori. Budget: ¥200,000.',
        tags: ['travel', 'japan'],
        color: '#4682B4', // SteelBlue
        isFavorite: false,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 ago
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        media: [
            { type: 'image', uri: 'https://picsum.photos/id/10/200/200' }
        ]
    },
    {
        id: 'note7',
        title: 'Recipe: Spicy Garlic Noodles',
        content: 'Ingredients: Noodles, garlic, chili flakes, soy sauce, sesame oil, brown sugar, green onions. Instructions: Boil noodles, sauté garlic, mix sauce, combine.',
        tags: ['cooking', 'recipe'],
        color: '#FF8C00', // DarkOrange
        isFavorite: false,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 ago
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note8',
        title: 'Car Maintenance Checklist',
        content: 'Oil change (every 5000 miles), tire rotation (every 7500 miles), brake inspection, fluid checks, air filter replacement.',
        tags: ['car', 'maintenance'],
        color: '#808000', // Olive
        isFavorite: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 ago
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note9',
        title: 'Gift Ideas for Mom',
        content: 'Spa day voucher, new gardening tools, personalized photo album, her favorite perfume, a subscription box.',
        tags: ['personal', 'gifts'],
        color: '#CD5C5C', // IndianRed
        isFavorite: true,
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 ago
        updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note10',
        title: 'Quotes to remember',
        content: '"The only way to do great work is to love what you do." - Steve Jobs. "Believe you can and you\'re halfway there." - Theodore Roosevelt.',
        tags: ['inspiration', 'quotes'],
        color: '#20B2AA', // LightSeaGreen
        isFavorite: false,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 ago
        updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note11',
        title: 'Home Renovation Ideas',
        content: 'Kitchen: new countertops, island, smart appliances. Bathroom: walk-in shower, heated floors. Living room: built-in shelves, fireplace.',
        tags: ['home', 'renovation'],
        color: '#9370DB', // MediumPurple
        isFavorite: false,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 ago
        updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        media: [
            { type: 'image', uri: 'https://picsum.photos/id/1060/200/200' }
        ]
    },
    {
        id: 'note12',
        title: 'Investment Strategy',
        content: 'Diversify portfolio, long-term growth, low-cost index funds, rebalance annually. Research emerging markets.',
        tags: ['finance', 'investing'],
        color: '#FF69B4', // HotPink
        isFavorite: false,
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 ago
        updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note13',
        title: 'Language Learning - Spanish',
        content: 'Practice daily vocabulary, grammar exercises, watch Spanish movies with subtitles, find a conversation partner. DuoLingo lessons.',
        tags: ['education', 'language'],
        color: '#5F9EA0', // CadetBlue
        isFavorite: true,
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(), // 55 ago
        updatedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        media: [
            { type: 'audio', uri: 'spanish_phrases.mp3' }
        ]
    },
    {
        id: 'note14',
        title: 'Gardening Tips',
        content: 'Water in the morning, use organic compost, prune regularly, check for pests, choose plants suitable for your climate zone.',
        tags: ['hobby', 'gardening'],
        color: '#9ACD32', // YellowGreen
        isFavorite: false,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 ago
        updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note15',
        title: 'Website Redesign Feedback',
        content: 'Improve navigation menu, simplify checkout process, update product images, add customer testimonials. Mobile responsiveness is key.',
        tags: ['work', 'design'],
        color: '#FF4500', // OrangeRed
        isFavorite: false,
        createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(), // 65 ago
        updatedAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note16',
        title: 'Future Goals',
        content: 'Run a marathon, learn to play guitar, write a novel, travel to Antarctica, start a small business. Prioritize health and well-being.',
        tags: ['personal', 'goals'],
        color: '#40E0D0', // Turquoise
        isFavorite: true,
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), // 70 ago
        updatedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    },
    {
        id: 'note17',
        title: 'Weekend Getaway Ideas',
        content: 'Hiking in the mountains, beach trip, city break with museum visits, camping in a national park. Check weather forecasts.',
        tags: ['travel', 'leisure'],
        color: '#BA55D3', // MediumOrchid
        isFavorite: false,
        createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), // 75 ago
        updatedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        media: [
            { type: 'image', uri: 'https://picsum.photos/id/1084/200/200' }
        ]
    },
    {
        id: 'note18',
        title: 'New Project Brainstorm',
        content: 'Sustainable energy solutions, AI-powered personal assistant, decentralized social media platform, smart home integration.',
        tags: ['work', 'brainstorm'],
        color: '#7B68EE', // MediumSlateBlue
        isFavorite: false,
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(), // 80 ago
        updatedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
        media: []
    }
];

const availableColors = [
    '#FF6347', '#3CB371', '#6A5ACD', '#FFD700', '#DA70D6', '#4682B4', '#FF8C00', '#808000', '#CD5C5C', '#20B2AA',
    '#9370DB', '#FF69B4', '#5F9EA0', '#9ACD32', '#FF4500', '#40E0D0', '#BA55D3', '#7B68EE'
];

//  REUSABLE COMPONENTS 

const Header = ({ title, onBackPress, rightAction, rightIcon, rightText, rightAction2, rightIcon2, rightText2 }) => (
    <View style={styles.header}>
        {onBackPress && (
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onBackPress(); }} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>{'< Back'}</Text>
            </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRightActions}>
            {rightAction2 && (
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); rightAction2(); }} style={styles.headerButton}>
                    {rightIcon2 && <Text style={styles.headerButtonText}>{rightIcon2}</Text>}
                    {rightText2 && <Text style={styles.headerButtonText}>{rightText2}</Text>}
                </TouchableOpacity>
            )}
            {rightAction && (
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); rightAction(); }} style={styles.headerButton}>
                    {rightIcon && <Text style={styles.headerButtonText}>{rightIcon}</Text>}
                    {rightText && <Text style={styles.headerButtonText}>{rightText}</Text>}
                </TouchableOpacity>
            )}
        </View>
    </View>
);

const TabBar = ({ activeTab, setActiveTab, notifications }) => {
    const tabs = [
        { key: 'home', icon: '\u{1F3E0}', label: 'Home' },
        { key: 'notes', icon: '\u{1F4CB}', label: 'Notes' },
        { key: 'add', icon: '\u2795', label: 'Add' },
        { key: 'favorites', icon: '\u2764', label: 'Favs', badge: notifications.favorites },
        { key: 'settings', icon: '\u2699', label: 'Settings' }
    ];

    return (
        <View style={styles.tabBar}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={styles.tabItem}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveTab(tab.key);
                    }}
                >
                    <Text style={[styles.tabIcon, activeTab === tab.key && styles.tabIconActive]}>
                        {tab.icon}
                    </Text>
                    <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                        {tab.label}
                    </Text>
                    {tab.badge > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const NoteCard = ({ note, onPress, onToggleFavorite, onEdit, onDelete }) => {
    const animatedScale = useRef(new Animated.Value(1)).current;

    const animatePressIn = useCallback(() => {
        Haptics.selectionAsync();
        Animated.spring(animatedScale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10
        }).start();
    }, [animatedScale]);

    const animatePressOut = useCallback(() => {
        Animated.spring(animatedScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10
        }).start();
    }, [animatedScale]);

    const handlePress = useCallback(() => {
        onPress(note.id);
    }, [onPress, note.id]);

    const handleToggleFavorite = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggleFavorite(note.id);
    }, [onToggleFavorite, note.id]);

    const getPreviewContent = (content, media) => {
        let preview = content.split('\n')[0]; // First line of content
        if (media && media.length > 0) {
            const imageCount = media.filter(m => m.type === 'image').length;
            const audioCount = media.filter(m => m.type === 'audio').length;
            if (imageCount > 0) preview += ` \u{1F4F7}${imageCount}`;
            if (audioCount > 0) preview += ` \u{1F4C4}${audioCount}`; // Audio file icon
        }
        return preview;
    };


    return (
        <Pressable
            onPressIn={animatePressIn}
            onPressOut={animatePressOut}
            onPress={handlePress}
            style={({ pressed }) => [
                styles.noteCard,
                { transform: [{ scale: animatedScale }] },
                { borderColor: note.color || Theme.elevated, borderWidth: 2 }
            ]}
        >
            <View style={styles.noteCardHeader}>
                <Text style={styles.noteCardTitle} numberOfLines={1}>{note.title}</Text>
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.noteCardFavButton}>
                    <Text style={styles.noteCardFavIcon}>{note.isFavorite ? '\u2764\uFE0F' : '\u2661'}</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.noteCardContent} numberOfLines={2}>{getPreviewContent(note.content, note.media)}</Text>
            <View style={styles.noteCardTagsContainer}>
                {note.tags && note.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{tag}</Text>
                    </View>
                ))}
                {note.tags && note.tags.length > 3 && (
                    <View style={styles.tagChip}>
                        <Text style={styles.tagChipText}>+{note.tags.length - 3}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.noteCardDate}>Created: {getTimeAgo(note.createdAt)}</Text>
        </Pressable>
    );
};

const Button = ({ title, onPress, style, textStyle, primary = true, danger = false, disabled = false }) => (
    <TouchableOpacity
        onPress={() => {
            if (!disabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }
        }}
        style={[
            styles.button,
            primary && styles.buttonPrimary,
            danger && styles.buttonDanger,
            disabled && styles.buttonDisabled,
            style
        ]}
        disabled={disabled}
    >
        <Text style={[styles.buttonText, primary && styles.buttonTextPrimary, danger && styles.buttonTextDanger, disabled && styles.buttonTextDisabled, textStyle]}>
            {title}
        </Text>
    </TouchableOpacity>
);

const SearchBar = ({ searchText, onSearchChange, onClearSearch, placeholder = 'Search notes...' }) => (
    <View style={styles.searchContainer}>
        <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={Theme.secondary}
            value={searchText}
            onChangeText={onSearchChange}
            keyboardAppearance="dark"
        />
        {searchText.length > 0 && (
            <TouchableOpacity onPress={onClearSearch} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchIcon}>\u274C</Text>
            </TouchableOpacity>
        )}
    </View>
);

const FilterChip = ({ label, selected, onPress, icon }) => (
    <TouchableOpacity
        style={[styles.filterChip, selected && styles.filterChipSelected]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    >
        {icon && <Text style={styles.filterChipIcon}>{icon}</Text>}
        <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
);

const EmptyState = ({ message, icon = '\u{1F4DD}', onRefresh, refreshText = 'Refresh' }) => (
    <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateIcon}>{icon}</Text>
        <Text style={styles.emptyStateMessage}>{message}</Text>
        {onRefresh && (
            <Button title={refreshText} onPress={onRefresh} style={styles.emptyStateButton} />
        )}
    </View>
);

const Toast = ({ message, type, onHide }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-50)).current; // Start above screen

    useEffect(() => {
        if (message) {
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
                            toValue: -50,
                            duration: 300,
                            useNativeDriver: true
                        })
                    ]).start(() => onHide());
                }, 2500);
            });
        }
    }, [message, fadeAnim, slideAnim, onHide]);

    if (!message) return null;

    let backgroundColor = Theme.surface;
    if (type === 'success') backgroundColor = Theme.success;
    if (type === 'error') backgroundColor = Theme.danger;
    if (type === 'warning') backgroundColor = Theme.warning;

    return (
        <Animated.View style={[styles.toastContainer, { backgroundColor, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

const LoadingOverlay = () => (
    <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
    </View>
);

const ColorPicker = ({ selectedColor, onSelectColor }) => (
    <View style={styles.colorPickerContainer}>
        {availableColors.map((color) => (
            <TouchableOpacity
                key={color}
                style={[styles.colorOption, { backgroundColor: color }]}
                onPress={() => { Haptics.selectionAsync(); onSelectColor(color); }}
            >
                {selectedColor === color && (
                    <Text style={styles.colorOptionSelected}>\u2705</Text>
                )}
            </TouchableOpacity>
        ))}
    </View>
);

const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => (
    <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onCancel}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalMessage}>{message}</Text>
                <View style={styles.modalActions}>
                    <Button title={cancelText} onPress={onCancel} primary={false} style={styles.modalButton} />
                    <Button title={confirmText} onPress={onConfirm} danger={danger} style={styles.modalButton} />
                </View>
            </View>
        </View>
    </Modal>
);

//  SCREEN COMPONENTS 

const HomeScreen = ({ notes, goToNoteDetail, goToCreateNote }) => {
    const sortedNotes = useMemo(() => notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [notes]);
    const recentNotes = useMemo(() => sortedNotes.slice(0, 5), [sortedNotes]);
    const favoriteNotesCount = useMemo(() => notes.filter(n => n.isFavorite).length, [notes]);

    const noteColors = useMemo(() => {
        const counts = {};
        notes.forEach(note => {
            counts[note.color] = (counts[note.color] || 0) + 1;
        });
        return Object.entries(counts).sort(([, a], [, b]) => b - a);
    }, [notes]);

    return (
        <SafeAreaView style={styles.screenContainer}>
            <StatusBar style="light" />
            <Header title="Dashboard" rightIcon='\u2795' rightAction={goToCreateNote} />

            <ScrollView contentContainerStyle={styles.homeScrollViewContent} showsVerticalScrollIndicator={false}>
                <View style={styles.homeStatsContainer}>
                    <LinearGradient
                        colors={['#1e293b', '#263548']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.homeStatCard}
                    >
                        <Text style={styles.homeStatIcon}>\u{1F4DD}</Text>
                        <Text style={styles.homeStatValue}>{notes.length}</Text>
                        <Text style={styles.homeStatLabel}>Total Notes</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['#1e293b', '#263548']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.homeStatCard}
                    >
                        <Text style={styles.homeStatIcon}>\u2764</Text>
                        <Text style={styles.homeStatValue}>{favoriteNotesCount}</Text>
                        <Text style={styles.homeStatLabel}>Favorite Notes</Text>
                    </LinearGradient>
                </View>

                <Text style={styles.sectionTitle}>Recently Added</Text>
                {recentNotes.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentNotesScroll}>
                        {recentNotes.map((note) => (
                            <TouchableOpacity key={note.id} style={[styles.recentNoteCard, { borderColor: note.color }]} onPress={() => goToNoteDetail(note.id)}>
                                <Text style={styles.recentNoteTitle} numberOfLines={1}>{note.title}</Text>
                                <Text style={styles.recentNoteContent} numberOfLines={2}>{note.content}</Text>
                                <Text style={styles.recentNoteTime}>{getTimeAgo(note.createdAt)}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <EmptyState message="No recent notes. Start by adding one!" icon='\u{1F5D2}' />
                )}

                <Text style={styles.sectionTitle}>Notes by Color</Text>
                {noteColors.length > 0 ? (
                    <View style={styles.colorDistributionContainer}>
                        {noteColors.map(([color, count]) => (
                            <View key={color} style={styles.colorBarItem}>
                                <View style={[styles.colorBar, { backgroundColor: color, width: `${(count / notes.length) * 100}%` }]} />
                                <Text style={styles.colorBarLabel}>{count} notes</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyStateMessage}>No color-coded notes yet.</Text>
                )}

                <Button title="Quick Add Note" onPress={goToCreateNote} style={styles.quickAddButton} />
            </ScrollView>
        </SafeAreaView>
    );
};

const NotesListScreen = ({ notes, goToNoteDetail, onToggleFavorite, goToCreateNote, currentTab }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedColorFilter, setSelectedColorFilter] = useState('');
    const [selectedTagFilter, setSelectedTagFilter] = useState('');
    const [isFavoritedFilter, setIsFavoritedFilter] = useState(currentTab === 'favorites');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'title'
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Reset filters when tab changes, especially for favorites tab
        if (currentTab === 'favorites') {
            setIsFavoritedFilter(true);
            setSearchText('');
            setSelectedColorFilter('');
            setSelectedTagFilter('');
            setSortBy('newest');
        } else {
            setIsFavoritedFilter(false);
        }
    }, [currentTab]);

    const allTags = useMemo(() => {
        const tags = new Set();
        notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [notes]);

    const filteredAndSortedNotes = useMemo(() => {
        let filtered = notes;

        if (currentTab === 'favorites' || isFavoritedFilter) {
            filtered = filtered.filter(note => note.isFavorite);
        }

        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(lowerSearchText) ||
                note.content.toLowerCase().includes(lowerSearchText) ||
                note.tags.some(tag => tag.toLowerCase().includes(lowerSearchText))
            );
        }

        if (selectedColorFilter) {
            filtered = filtered.filter(note => note.color === selectedColorFilter);
        }

        if (selectedTagFilter) {
            filtered = filtered.filter(note => note.tags.includes(selectedTagFilter));
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortBy === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
}
})