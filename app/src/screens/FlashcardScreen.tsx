import { API_URL } from '../api';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';

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
    if (direction === 'next' && currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const markWrong = async () => {
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

  if (words.length === 0) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const currentWord: any = words[currentIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={flipCard} activeOpacity={1}>
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
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Button icon="arrow-left" mode="contained" onPress={() => handleSwipe('prev')} disabled={currentIndex === 0}>
          Prev
        </Button>
        <Button icon="close" mode="contained" color="#ff4d4d" onPress={markWrong}>
          Wrong
        </Button>
        <Button icon="check" mode="contained" color="#4caf50" onPress={() => handleSwipe('next')}>
          Correct
        </Button>
        <Button icon="arrow-right" mode="contained" onPress={() => handleSwipe('next')} disabled={currentIndex === words.length - 1}>
          Next
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: 300,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
  },
  cardText: {
    fontSize: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});
