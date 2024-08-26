import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Paragraph from '../components/Paragraph';
import Button from '../components/Button';
import moment from 'moment';
import { Select } from 'react-native-paper';
import { Provider as PaperProvider } from 'react-native-paper';

export default function Dashboard({ navigation }) {
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  useEffect(() => {
    fetchGames(selectedWeek);
  }, [selectedWeek]);

  const fetchGames = async (week) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://cdn.espn.com/core/nfl/schedule?xhr=1&year=2024&week=${week}`);
      const data = await response.json();
      
      // Parse the data to extract game information
      const allSchedules = Object.values(data['content']['schedule']);
      
      // Flatten all games
      const flattenedGames = allSchedules.flatMap(schedule => {
        return schedule.games.map(game => ({
          id: game.id,
          name: game.name,
          date: game.date,
          time: game.time,
          venue: game.competitions[0].venue.fullName,
          city: game.competitions[0].venue.address.city,
          state: game.competitions[0].venue.address.state,
          tickets: game.competitions[0].tickets[0],
        }));
      });

      // Sort games by date and day of month
      const sortedGames = flattenedGames.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
      });

      // Group by date
      const groupedGames = {};
      sortedGames.forEach(game => {
        const formattedDate = moment(new Date(game.date)).format("MMMM D");
        if (!groupedGames[formattedDate]) {
          groupedGames[formattedDate] = [];
        }
        groupedGames[formattedDate].push(game);
      });

      setGames(groupedGames);
      setLoading(false);
    } catch (err) {
      setError('Failed to load games data');
      setLoading(false);
    }
  };

  const renderGameItem = ({ item }) => (
    <View style={styles.gameItem}>
      <Text style={styles.team}>{item.name}</Text>
      <Text style={styles.time}>{new Date(item.date).toLocaleString()}</Text>
      <Text style={styles.venue}>{item.venue}, {item.city}, {item.state}</Text>
      {item.tickets && (
        <View>
          <Text style={styles.tickets}>Tickets: {item.tickets.summary}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(item.tickets.links[0].href)}>
            <Text style={styles.link}>Buy Tickets</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderDivider = () => (
    <View style={styles.divider} />
  );

  const renderWeekSelector = () => (
    <ScrollView contentContainerStyle={styles.weekSelectorContainer}>
      <Text style={styles.weekSelectorLabel}>Select Week:</Text>
      {[...Array(18)].map((_, index) => (
        <TouchableOpacity 
          key={index} 
          style={[styles.weekOption, selectedWeek === index + 1 ? styles.selectedOption : {}]}
          onPress={() => setSelectedWeek(index + 1)}
        >
          <Text style={styles.weekNumber}>{index + 1}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Background>
      <Logo />
      <Header>Week {selectedWeek} NFL Schedule</Header>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : (
        <>
          {renderWeekSelector()}
          <FlatList
            data={Object.keys(games)}
            renderItem={({ item }) => (
              <>
                {renderDivider()}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{item}</Text>
                </View>
                <FlatList
                  data={games[item]}
                  renderItem={renderGameItem}
                  keyExtractor={(game, index) => game.id || index.toString()}
                />
              </>
            )}
            keyExtractor={(item, index) => item}
            ItemSeparatorComponent={() => null}
          />
        </>
      )}
      <Button
        mode="outlined"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'StartScreen' }],
          })
        }
      >
        Logout
      </Button>
    </Background>
  );
}

const styles = StyleSheet.create({
  gameItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  team: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  venue: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  tickets: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    fontSize: 14,
    color: 'blue',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
  sectionHeader: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
  weekSelectorContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  weekSelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weekOption: {
    width: 40,
    height: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    marginBottom: 5,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  weekNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

