# Quantum-Adventures
import React from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Image, ScrollView } from 'react-native';
import Lesson from './components/Lesson';
import Quiz from './components/Quiz';
import CharacterGuide from './components/CharacterGuide';
import InAppPurchase from './components/InAppPurchase';

export default function App() {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [currentQuiz, setCurrentQuiz] = useState(1);
  const [quizScore, setQuizScore] = useState(0);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [showCharacterGuide, setShowCharacterGuide] = useState(false);
  const [showInAppPurchase, setShowInAppPurchase] = useState(false);

  const completeLesson = () => {
    setIsLessonComplete(true);
  };

  const startNextLesson = () => {
    setCurrentLesson(currentLesson + 1);
    setIsLessonComplete(false);
  };

  const startNextQuiz = () => {
    setCurrentQuiz(currentQuiz + 1);
    setQuizScore(0);
  };

  const onQuizComplete = (score) => {
    setQuizScore(score);
  };

  const openCharacterGuide = () => {
    setShowCharacterGuide(true);
  };

  const closeCharacterGuide = () => {
    setShowCharacterGuide(false);
  };

  const openInAppPurchase = () => {
    setShowInAppPurchase(true);
  };

  const closeInAppPurchase = () => {
    setShowInAppPurchase(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quantum Fun Adventures</Text>
      </View>
      <ScrollView>
        <View style={styles.content}>
          <Lesson
            id={currentLesson}
            onComplete={completeLesson}
            isComplete={isLessonComplete}
            onNext={startNextLesson}
          />
          {isLessonComplete ? (
            <Quiz id={currentQuiz} onQuizComplete={onQuizComplete} onNext={startNextQuiz} />
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.characterButton} onPress={openCharacterGuide}>
          <Image source={require('./assets/character.png')} style={styles.characterImage} />
        </TouchableOpacity>
        <View style={styles.quizScore}>
          <Text style={styles.quizScoreText}>Score: {quizScore}</Text>
        </View>
        <TouchableOpacity style={styles.purchaseButton} onPress={openInAppPurchase}>
          <Text style={styles.purchaseButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
      {showCharacterGuide ? (
        <CharacterGuide onClose={closeCharacterGuide} />
      ) : null}
      {showInAppPurchase ? (
        <InAppPurchase onClose={closeInAppPurchase} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {}
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    height: 50,
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  lessonImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginVertical: 10,
  },
  lessonContent: {
    fontSize: 18,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  quizContainer: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 20,
  },
  quizQuestion: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quizAnswer: {
    fontSize: 18,
    marginVertical: 5,
  },
  quizButton: {
    marginVertical: 10,
    backgroundColor: '#0099ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    height: 80,
    backgroundColor: '#0099ff',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  characterButton: {
    padding: 5,
  },
  characterImage: {
    width: 30,
    height: 30,
  },
  quizScore: {
    alignItems: 'center',
  },
  quizScoreText: {
    fontSize: 18,
    color: '#fff',
  },
  purchaseButton: {
    backgroundColor: '#ff9b00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  lessonImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginVertical: 10,
  },
  lessonContent: {
    fontSize: 18,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  quizContainer: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 20,
  },
  quizQuestion: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  quizAnswer: {
    fontSize: 18,
    marginVertical: 5,
  },
  quizButton: {
    marginVertical: 10,
    backgroundColor: '#0099ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    height: 80,
    backgroundColor: '#0099ff',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  characterButton: {
    padding: 5,
  },
  characterImage: {
    width: 30,
    height: 30,
  },
  quizScore: {
    alignItems: 'center',
  },
  quizScoreText: {
    fontSize: 18,
    color: '#fff',
  },
  purchaseButton: {
    backgroundColor: '#ff9b00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

    backgroundColor: '#ff9b00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Image, ScrollView } from 'react-native';
import Lesson from './components/Lesson';
import Quiz from './components/Quiz';
import CharacterGuide from './components/CharacterGuide';
import InAppPurchase from './components/InAppPurchase';

export default function App() {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [currentQuiz, setCurrentQuiz] = useState(1);
  const [quizScore, setQuizScore] = useState(0);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [showCharacterGuide, setShowCharacterGuide] = useState(false);
  const [showInAppPurchase, setShowInAppPurchase] = useState(false);

  const completeLesson = () => {
    setIsLessonComplete(true);
  };

  const startNextLesson = () => {
    setCurrentLesson(currentLesson + 1);
    setIsLessonComplete(false);
  };

  const startNextQuiz = () => {
    setCurrentQuiz(currentQuiz + 1);
    setQuizScore(0);
  };

  const onQuizComplete = (score) => {
    setQuizScore(score);
  };

  const openCharacterGuide = () => {
    setShowCharacterGuide(true);
  };

  const closeCharacterGuide = () => {
    setShowCharacterGuide(false);
  };

  const openInAppPurchase = () => {
    setShowInAppPurchase(true);
  };

  const closeInAppPurchase = () => {
    setShowInAppPurchase(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quantum Fun Adventures</Text>
      </View>
      <ScrollView>
        <View style={styles.content}>
          <Lesson
            id={currentLesson}
            onComplete={completeLesson}
            isComplete={isLessonComplete}
            onNext={startNextLesson}
          />
          {isLessonComplete ? (
            <Quiz id={currentQuiz} onQuizComplete={onQuizComplete} onNext={startNextQuiz} />
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.characterButton} onPress={openCharacterGuide}>
          <Image source={require('./assets/character.png')} style={styles.characterImage} />
        </TouchableOpacity>
        <View style={styles.quizScore}>
          <Text style={styles.quizScoreText}>Score: {quizScore}</Text>
        </View>
        <TouchableOpacity style={styles.purchaseButton} onPress={openInAppPurchase}>
          <Text style={styles.purchaseButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
      {showCharacterGuide ? (
        <CharacterGuide onClose={closeCharacterGuide} />
      ) : null}
      {showInAppPurchase ? (
        <InAppPurchase onClose={closeInAppPurchase} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    height: 50,
    backgroundColor: '#1a1a1a
import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Image, ScrollView } from 'react-native';
import Lesson from './components/Lesson';
import Quiz from './components/Quiz';
import CharacterGuide from './components/CharacterGuide';
import InAppPurchase from './components/InAppPurchase';

export default function App() {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [currentQuiz, setCurrentQuiz] = useState(1);
  const [quizScore, setQuizScore] = useState(0);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [showCharacterGuide, setShowCharacterGuide] = useState(false);
  const [showInAppPurchase, setShowInAppPurchase] = useState(false);

  const completeLesson = () => {
    setIsLessonComplete(true);
  };

  const startNextLesson = () => {
    setCurrentLesson(currentLesson + 1);
    setIsLessonComplete(false);
  };

  const startNextQuiz = () => {
    setCurrentQuiz(currentQuiz + 1);
    setQuizScore(0);
  };

  const onQuizComplete = (score) => {
    setQuizScore(score);
  };

  const openCharacterGuide = () => {
    setShowCharacterGuide(true);
  };

  const closeCharacterGuide = () => {
    setShowCharacterGuide(false);
  };

  const openInAppPurchase = () => {
    setShowInAppPurchase(true);
  };

  const closeInAppPurchase = () => {
    setShowInAppPurchase(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quantum Fun Adventures</Text>
      </View>
      <ScrollView>
        <View style={styles.content}>
          <Lesson
            id={currentLesson}
            onComplete={completeLesson}
            isComplete={isLessonComplete}
            onNext={startNextLesson}
          />
          {isLessonComplete ? (
            <Quiz id={currentQuiz} onQuizComplete={onQuizComplete} onNext={startNextQuiz} />
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.characterButton} onPress={openCharacterGuide}>
          <Image source={require('./assets/character.png')} style={styles.characterImage} />
        </TouchableOpacity>
        <View style={styles.quizScore}>
          <Text style={styles.quizScoreText}>Score: {quizScore}</Text>
        </View>
        <TouchableOpacity style={styles.purchaseButton} onPress={openInAppPurchase}>
          <Text style={styles.purchaseButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
      {showCharacterGuide ? (
        <CharacterGuide onClose={closeCharacterGuide} />
      ) : null}
      {showInAppPurchase ? (
        <InAppPurchase onClose={closeInAppPurchase} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    height: 50,
    backgroundColor: '#1a1a1a
alignItems: 'center',
justifyContent: 'space-between',
flexDirection: 'row',
paddingHorizontal: 20,
characterButtonalignItems: 'center',
justifyContent: 'space-between',
flexDirection: 'row',
paddingHorizontal: 20,
