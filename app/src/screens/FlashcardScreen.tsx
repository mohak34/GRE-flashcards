import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { API_URL } from '../api';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';

export const FlashcardScreen = ({ route, navigation }: any) => {
  const { groupId, groupName } = route.params;
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ title: groupName });
    const fetchWords = async () => {
      try {
        const response = await fetch(`${API_URL}/groups/${groupId}/words`);
        const data = await response.json();
        setWords(data);
      } catch (error) {
        console.error('Error fetching words:', error);
      }
    };

    fetchWords();
  }, [groupId, groupName]);

  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsFlipped(!isFlipped));
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const handleSwipe = (direction: 'next' | 'prev') => {
    if (
      (direction === 'prev' && currentIndex === 0) ||
      (direction === 'next' && currentIndex === words.length - 1)
    ) {
      return;
    }

    const slideToValue = direction === 'next' ? -500 : 500;
    // To change the animation speed, adjust the `duration` value here.
    // A lower number means a faster animation.
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: slideToValue,
        duration: 150, // Change this value to adjust speed
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 150, // Change this value to adjust speed
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsCorrect(false);
      setIsWrong(false);
      if (direction === 'next' && currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      setIsFlipped(false);
      flipAnimation.setValue(0);
      slideAnimation.setValue(-slideToValue);
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 150, // Change this value to adjust speed
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150, // Change this value to adjust speed
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const [isWrong, setIsWrong] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  const onSwipe = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      if (event.nativeEvent.translationX > 50) {
        handleSwipe('prev');
      } else if (event.nativeEvent.translationX < -50) {
        handleSwipe('next');
      }
    }
  };

  const markWrong = async () => {
    setIsWrong(true);
    const word: any = words[currentIndex];
    try {
      await fetch(`${API_URL}/words/${word.id}/mark-wrong`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking word as wrong:', error);
    }
    handleSwipe('next');
  };

  const markCorrect = () => {
    setIsCorrect(true);
    handleSwipe('next');
  };

  if (words.length === 0) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const currentWord: any = words[currentIndex];

  return (
    <PanGestureHandler onHandlerStateChange={onSwipe}>
      <View style={styles.container}>
        <Animated.View style={[styles.cardContainer, { opacity: fadeAnimation, transform: [{ translateX: slideAnimation }] }]}>
          <TapGestureHandler onHandlerStateChange={({ nativeEvent }) => nativeEvent.state === State.ACTIVE && flipCard()}>
            <View style={styles.touchableCard}>
              <Animated.View style={[styles.card, { transform: [{ rotateY: frontInterpolate }] }]}>
                <Card.Content>
                  <Text style={styles.cardText}>{currentWord.text}</Text>
                </Card.Content>
              </Animated.View>
              <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
                <Card.Content>
                  <Text style={styles.cardText}>{currentWord.meaning}</Text>
                </Card.Content>
              </Animated.View>
            </View>
          </TapGestureHandler>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: isWrong ? 'red' : '#9DB2BF' }]} onPress={markWrong}>
              <MaterialCommunityIcons name="close-thick" size={32} color="#F8EDE3" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: isCorrect ? 'green' : '#9DB2BF' }]} onPress={markCorrect}>
              <MaterialCommunityIcons name="check-bold" size={32} color="#F8EDE3" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  cardContainer: {
    width: '100%',
    height: '45%',
    backgroundColor: '#27374D',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    backgroundColor: 'transparent',
    padding: 20,
  },
  cardBack: {
    position: 'absolute',
    top: 0,
  },
  cardText: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    color: '#F8EDE3',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
