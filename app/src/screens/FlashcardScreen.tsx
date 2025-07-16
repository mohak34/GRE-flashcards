import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PanGestureHandler,
  State,
  TapGestureHandler,
} from "react-native-gesture-handler";
import { API_URL } from "../api";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, StyleSheet, Animated, Easing, PanResponder } from "react-native";
import { Text, Card } from "react-native-paper";
import { TouchableOpacity } from "react-native";

export const FlashcardScreen = ({ route, navigation }: any) => {
  const { groupId, groupName, wrongWords } = route.params || {};
  const [words, setWords] = useState([]);
  const [originalWords, setOriginalWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ 
      title: wrongWords ? 'Wrong Words' : groupName,
      headerRight: () => (
        <TouchableOpacity
          onPress={shuffleWords}
          style={[
            styles.shuffleButton,
            { backgroundColor: isShuffled ? '#F8EDE3' : 'transparent' }
          ]}
        >
          <MaterialCommunityIcons
            name="shuffle"
            size={20}
            color={isShuffled ? '#121212' : '#F8EDE3'}
          />
        </TouchableOpacity>
      ),
    });
    
    const fetchWords = async () => {
      try {
        let data;
        if (wrongWords) {
          data = wrongWords;
        } else {
          console.log('Fetching words for group:', groupId);
          const response = await fetch(`${API_URL}/groups/${groupId}/words`);
          console.log('Response status:', response.status);
          data = await response.json();
          console.log('Fetched words:', data.length, 'words');
        }
        console.log('Setting words state...');
        setWords(data);
        setOriginalWords(data);
        console.log('Words state should be updated');
      } catch (error) {
        console.error("Error fetching words:", error);
      }
    };

    fetchWords();
  }, [groupId, groupName, wrongWords]);

  useEffect(() => {
    console.log('Words state changed, length:', words.length);
  }, [words]);

  const shuffleWords = () => {
    if (isShuffled) {
      setWords([...originalWords]);
      setIsShuffled(false);
    } else {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setWords(shuffled);
      setIsShuffled(true);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    flipAnimation.setValue(0);
  };

  const flipCard = () => {
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);
    Animated.timing(flipAnimation, {
      toValue: newFlippedState ? 180 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const [isWrong, setIsWrong] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const nextCardOffset = useRef(new Animated.Value(400)).current;
  const prevCardOffset = useRef(new Animated.Value(-400)).current;

  useEffect(() => {
    if (words.length === 0) return;
    
    // Update card positions based on pan gesture
    const listener = pan.x.addListener(({ value }) => {
      if (value < 0 && currentIndex < words.length - 1) {
        // Dragging left, show next card
        const newOffset = Math.max(0, 400 + value);
        nextCardOffset.setValue(newOffset);
      } else if (value > 0 && currentIndex > 0) {
        // Dragging right, show previous card  
        const newOffset = Math.min(0, -400 + value);
        prevCardOffset.setValue(newOffset);
      } else {
        // Reset positions when not in valid drag range
        nextCardOffset.setValue(400);
        prevCardOffset.setValue(-400);
      }
    });

    return () => {
      pan.x.removeListener(listener);
    };
  }, [currentIndex, words.length, words]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Prevent swiping right when on first word
          if (currentIndex === 0 && gestureState.dx > 0) {
            return false;
          }
          // Prevent swiping left when on last word
          if (currentIndex === words.length - 1 && gestureState.dx < 0) {
            return false;
          }
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        },
        onPanResponderMove: (evt, gestureState) => {
          // Prevent movement if on first word and trying to go right
          if (currentIndex === 0 && gestureState.dx > 0) {
            return;
          }
          // Prevent movement if on last word and trying to go left
          if (currentIndex === words.length - 1 && gestureState.dx < 0) {
            return;
          }
          
          Animated.event(
            [
              null,
              {
                dx: pan.x,
              },
            ],
            { useNativeDriver: false }
          )(evt, gestureState);
        },
        onPanResponderRelease: (e, gestureState) => {
          console.log('Swipe detected:', gestureState.dx);
          console.log('Current index:', currentIndex);
          console.log('Words length:', words.length);
          
          if (words.length === 0) {
            console.log('No words loaded, ignoring swipe');
            return;
          }
          
          if (gestureState.dx > 100) {
            console.log('Attempting to go to previous word');
            if (currentIndex > 0) {
              console.log('Going to previous word');
              handleSwipe("prev");
            } else {
              console.log('Already at first word, returning to center');
              resetCardPositions();
            }
          } else if (gestureState.dx < -100) {
            console.log('Attempting to go to next word');
            if (currentIndex < words.length - 1) {
              console.log('Going to next word');
              handleSwipe("next");
            } else {
              console.log('Already at last word, returning to center');
              resetCardPositions();
            }
          } else {
            console.log('Insufficient swipe distance, returning to center');
            resetCardPositions();
          }
        },
      }),
    [words.length, currentIndex]
  );

  const resetCardPositions = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(nextCardOffset, {
        toValue: 400,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(prevCardOffset, {
        toValue: -400,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const handleSwipe = (direction: "next" | "prev") => {
    const isNext = direction === "next";
    const slideDirection = isNext ? -400 : 400;
    
    // Reset all card positions first
    pan.setValue({ x: 0, y: 0 });
    
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: slideDirection, y: 0 },
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(isNext ? nextCardOffset : prevCardOffset, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update state
      setCurrentIndex(prev => isNext ? prev + 1 : prev - 1);
      setIsFlipped(false);
      setIsCorrect(false);
      setIsWrong(false);
      flipAnimation.setValue(0);
      
      // Reset all positions immediately for new layout
      pan.setValue({ x: 0, y: 0 });
      nextCardOffset.setValue(400);
      prevCardOffset.setValue(-400);
    });
  };


  const markWrong = async () => {
    setIsWrong(true);
    const word: any = words[currentIndex];
    try {
      await fetch(`${API_URL}/words/${word.id}/mark-wrong`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error marking word as wrong:", error);
    }
    handleSwipe("next");
  };

  const markCorrect = () => {
    setIsCorrect(true);
    handleSwipe("next");
  };

  if (words.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const currentWord: any = words[currentIndex];
  const nextWord: any = currentIndex < words.length - 1 ? words[currentIndex + 1] : null;
  const prevWord: any = currentIndex > 0 ? words[currentIndex - 1] : null;

  const renderCard = (word: any, animatedStyle: any, isMain = false) => (
    <Animated.View
      style={[
        styles.cardContainer,
        animatedStyle,
        !isMain && { position: 'absolute' }
      ]}
    >
      <TouchableOpacity
        style={styles.touchableCard}
        onPress={isMain ? flipCard : undefined}
        disabled={!isMain}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ rotateY: isMain ? frontInterpolate : "0deg" }] },
          ]}
        >
          <Card.Content>
            <Text style={styles.cardText}>{word.text}</Text>
          </Card.Content>
        </Animated.View>
        {isMain && (
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] },
            ]}
          >
            <Card.Content>
              <Text style={styles.cardText}>{word.meaning}</Text>
            </Card.Content>
          </Animated.View>
        )}
      </TouchableOpacity>
      {isMain && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isWrong ? "red" : "#9DB2BF" },
            ]}
            onPress={markWrong}
          >
            <MaterialCommunityIcons
              name="close-thick"
              size={32}
              color="#F8EDE3"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isCorrect ? "green" : "#9DB2BF" },
            ]}
            onPress={markCorrect}
          >
            <MaterialCommunityIcons
              name="check-bold"
              size={32}
              color="#F8EDE3"
            />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View {...panResponder.panHandlers} style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        {/* Previous card */}
        {prevWord && renderCard(prevWord, { transform: [{ translateX: prevCardOffset }] })}
        
        {/* Current card */}
        {renderCard(currentWord, { transform: [{ translateX: pan.x }] }, true)}
        
        {/* Next card */}
        {nextWord && renderCard(nextWord, { transform: [{ translateX: nextCardOffset }] })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  cardContainer: {
    width: "100%",
    height: "45%",
    backgroundColor: "#27374D",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  touchableCard: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
    backgroundColor: "transparent",
    padding: 20,
  },
  cardBack: {
    position: "absolute",
    top: 0,
  },
  cardText: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    color: "#F8EDE3",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    position: "absolute",
    bottom: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  shuffleButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F8EDE3',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
