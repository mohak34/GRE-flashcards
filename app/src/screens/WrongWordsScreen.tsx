import { API_URL } from '../api';
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, List, Divider, Button, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

export const WrongWordsScreen = ({ navigation }: any) => {
  const [wrongWords, setWrongWords] = useState([]);

  const fetchWrongWords = async () => {
    try {
      const response = await fetch(`${API_URL}/wrong-words`);
      const data = await response.json();
      setWrongWords(data);
    } catch (error) {
      console.error('Error fetching wrong words:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchWrongWords();
    }, [])
  );

  const deleteWrongWord = async (wordId: number) => {
    try {
      const response = await fetch(`${API_URL}/wrong-words/${wordId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWrongWords(prev => prev.filter((word: any) => word.id !== wordId));
      } else {
        Alert.alert('Error', 'Failed to delete word from wrong list');
      }
    } catch (error) {
      console.error('Error deleting wrong word:', error);
      Alert.alert('Error', 'Failed to delete word from wrong list');
    }
  };

  const deleteAllWrongWords = async () => {
    try {
      const response = await fetch(`${API_URL}/wrong-words`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWrongWords([]);
      } else {
        Alert.alert('Error', 'Failed to clear wrong words list');
      }
    } catch (error) {
      console.error('Error clearing wrong words:', error);
      Alert.alert('Error', 'Failed to clear wrong words list');
    }
  };

  const goToFlashcards = () => {
    if (wrongWords.length === 0) {
      Alert.alert('No Words', 'There are no wrong words to practice.');
      return;
    }
    navigation.navigate('Flashcards', {
      wrongWords: wrongWords,
      groupName: 'Wrong Words',
    });
  };

  return (
    <View style={styles.container}>
      {wrongWords.length > 0 && (
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={goToFlashcards}
            style={styles.flashcardButton}
            labelStyle={styles.flashcardButtonText}
            icon="cards"
          >
            Practice Wrong Words
          </Button>
          <Button
            mode="outlined"
            onPress={deleteAllWrongWords}
            style={styles.deleteAllButton}
            labelStyle={styles.deleteAllButtonText}
            icon="delete-sweep"
          >
            Clear All
          </Button>
        </View>
      )}
      <FlatList
        data={wrongWords}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }: any) => (
          <>
            <List.Item
              title={item.text}
              description={item.meaning}
              left={props => <List.Icon {...props} icon="alert-circle" />}
              right={props => (
                <IconButton
                  {...props}
                  icon="delete"
                  iconColor="#F8EDE3"
                  onPress={() => deleteWrongWord(item.id)}
                />
              )}
            />
            <Divider />
          </>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No wrong words yet!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  buttonContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 10,
  },
  flashcardButton: {
    flex: 1,
    borderColor: '#F8EDE3',
  },
  flashcardButtonText: {
    color: '#F8EDE3',
    fontWeight: 'bold',
  },
  deleteAllButton: {
    flex: 1,
    borderColor: '#ff6b6b',
  },
  deleteAllButtonText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#9DB2BF',
    textAlign: 'center',
  },
});
