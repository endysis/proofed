import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../common';
import { useCrumbChat } from '../../hooks/useCrumbChat';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import type { ChatMessage, CrumbChatRequest } from '@proofed/shared';
import type { ItemUsageDetail } from '../../hooks/useItemUsageDetails';

const WELCOME_MESSAGES = [
  "Hello! I'm Crumb. What would you like to know about your {item}?",
  "Right, let's talk about your {item}. What's on your mind?",
  "Good to chat! What questions do you have about your {item}?",
  "Marvellous! Let's have a chat about your {item}, shall we?",
  "Ready to discuss your {item} whenever you are.",
  "Right then! What shall we discuss about your {item} today?",
  "Here to help with your {item}. Fire away with any questions.",
  "Let's get your {item} questions sorted.",
  "What would you like to know about your {item}?",
  "Brilliant! I'm here to answer questions about your {item}.",
  "Splendid! What's the question about your {item}?",
  "Ready when you are. What about your {item} can I help with?",
];

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();

    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.Text style={[styles.dot, { opacity: dot1 }]}>•</Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot2 }]}>•</Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot3 }]}>•</Animated.Text>
    </View>
  );
}

interface CrumbChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId: string;
  attemptName: string;
  itemUsageKey: string;
  itemDetail: ItemUsageDetail;
  otherItemNames: string[];
  chatHistory: ChatMessage[];
  onChatHistoryChange: (messages: ChatMessage[]) => void;
}

export default function CrumbChatModal({
  isOpen,
  onClose,
  attemptId,
  attemptName,
  itemDetail,
  otherItemNames,
  chatHistory,
  onChatHistoryChange,
}: CrumbChatModalProps) {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const crumbChat = useCrumbChat();

  const welcomeMessage = useMemo(() => {
    const template = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
    return template.replace('{item}', itemDetail.itemName.toLowerCase());
  }, [itemDetail.itemName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory.length]);

  const handleSend = () => {
    if (!inputText.trim() || crumbChat.isPending) return;

    const userMessage = inputText.trim();
    setInputText('');

    // Add user message to history
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: userMessage },
    ];
    onChatHistoryChange(updatedHistory);

    // Build context for the API request
    const request: CrumbChatRequest = {
      message: userMessage,
      chatHistory: chatHistory,
      context: {
        attemptName,
        focusedItem: {
          itemName: itemDetail.itemName,
          recipeName: itemDetail.recipeName,
          variantName: itemDetail.variantName,
          scaleFactor: itemDetail.scaleFactor,
          ingredients: itemDetail.ingredients,
          bakeTime: itemDetail.bakeTime,
          bakeTemp: itemDetail.bakeTemp,
          bakeTempUnit: itemDetail.bakeTempUnit,
        },
        otherItems: otherItemNames,
      },
    };

    crumbChat.mutate(
      { attemptId, request },
      {
        onSuccess: (response) => {
          onChatHistoryChange([
            ...updatedHistory,
            { role: 'assistant', content: response.reply },
          ]);
        },
        onError: (error) => {
          console.error('Crumb Chat Error:', error);
          onChatHistoryChange([
            ...updatedHistory,
            { role: 'assistant', content: 'Oh dear, something went wrong. Do try again, won\'t you?' },
          ]);
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <RNModal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <View style={[styles.modal, { paddingBottom: insets.bottom }]}>
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.crumbAvatar}>
                <Icon name="auto_awesome" size="sm" color={colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>Chat with Crumb</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  About: {itemDetail.itemName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" color={colors.dustyMauve} />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {chatHistory.length === 0 && (
              <View style={styles.welcomeContainer}>
                <View style={styles.welcomeAvatar}>
                  <Icon name="auto_awesome" size="xl" color={colors.primary} />
                </View>
                <Text style={styles.welcomeText}>
                  {welcomeMessage}
                </Text>
              </View>
            )}

            {chatHistory.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {message.role === 'assistant' && (
                  <View style={styles.assistantAvatar}>
                    <Icon name="auto_awesome" size="sm" color={colors.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageContent,
                    message.role === 'user' ? styles.userContent : styles.assistantContent,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}

            {crumbChat.isPending && (
              <View style={styles.typingIndicator}>
                <View style={styles.assistantAvatar}>
                  <Icon name="auto_awesome" size="sm" color={colors.primary} />
                </View>
                <View style={styles.typingBubble}>
                  <TypingDots />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Crumb a question..."
              placeholderTextColor={colors.dustyMauve}
              multiline
              maxLength={500}
              returnKeyType="default"
              editable={!crumbChat.isPending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || crumbChat.isPending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || crumbChat.isPending}
            >
              <Icon
                name="send"
                size="sm"
                color={inputText.trim() && !crumbChat.isPending ? colors.white : colors.dustyMauve}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    height: '80%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(157, 129, 137, 0.3)',
    borderRadius: borderRadius.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  crumbAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing[2],
    marginRight: -spacing[2],
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
  },
  welcomeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  welcomeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.5,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 52, 78, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
    marginTop: spacing[1],
  },
  messageContent: {
    maxWidth: '75%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  userContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing[1],
  },
  assistantContent: {
    backgroundColor: colors.bgLight,
    borderBottomLeftRadius: spacing[1],
  },
  messageText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.4,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgLight,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderBottomLeftRadius: spacing[1],
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  dot: {
    fontSize: 24,
    color: colors.primary,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: spacing[3],
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.bgLight,
  },
});
