import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { borderRadius, fs, spacing, iconSize } from '@/hooks/use-responsive';

interface Note {
  id: string;
  content: string;
  createdAt: number;
}

const NOTES_KEY = '@dailytools_notes';

export default function QuickNotesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const json = await AsyncStorage.getItem(NOTES_KEY);
      if (json) {
        setNotes(JSON.parse(json));
      }
    } catch (e) {
      console.error('Failed to load notes', e);
    }
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: Date.now(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    Alert.alert('删除笔记', '确定要删除这条笔记吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          const updated = notes.filter((n) => n.id !== id);
          setNotes(updated);
          saveNotes(updated);
        },
      },
    ]);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    const updated = notes.map((n) =>
      n.id === editingId ? { ...n, content: editContent.trim() } : n
    );
    setNotes(updated);
    saveNotes(updated);
    setEditingId(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={iconSize(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>速记本</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            placeholder="快速记录..."
            placeholderTextColor={theme.tabIconDefault}
            style={[styles.noteInput, { color: theme.text }]}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: newNote.trim() ? theme.tint : theme.cardMuted }]}
            onPress={addNote}
            disabled={!newNote.trim()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={iconSize(24)} color={newNote.trim() ? '#FFF' : theme.tabIconDefault} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {notes.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="note-add" size={iconSize(48)} color={theme.tabIconDefault} />
              <Text style={[styles.emptyText, { color: theme.tabIconDefault }]}>还没有笔记</Text>
              <Text style={[styles.emptyHint, { color: theme.tabIconDefault }]}>在上方输入内容开始记录</Text>
            </View>
          ) : (
            notes.map((note) => (
              <View
                key={note.id}
                style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                {editingId === note.id ? (
                  <View style={styles.editMode}>
                    <TextInput
                      value={editContent}
                      onChangeText={setEditContent}
                      style={[styles.editInput, { color: theme.text, backgroundColor: theme.cardMuted }]}
                      multiline
                      autoFocus
                      maxLength={500}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={cancelEdit} activeOpacity={0.7}>
                        <Text style={[styles.editBtn, { color: theme.tabIconDefault }]}>取消</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={saveEdit} activeOpacity={0.7}>
                        <Text style={[styles.editBtn, { color: theme.tint }]}>保存</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.noteContent, { color: theme.text }]}>{note.content}</Text>
                    <View style={styles.noteFooter}>
                      <Text style={[styles.noteDate, { color: theme.tabIconDefault }]}>
                        {formatDate(note.createdAt)}
                      </Text>
                      <View style={styles.noteActions}>
                        <TouchableOpacity onPress={() => startEdit(note)} activeOpacity={0.7}>
                          <MaterialIcons name="edit" size={iconSize(18)} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteNote(note.id)} activeOpacity={0.7}>
                          <MaterialIcons name="delete-outline" size={iconSize(18)} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
  },
  backBtn: {
    width: spacing(40),
    height: spacing(40),
    borderRadius: borderRadius(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(16),
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: borderRadius(18),
    borderWidth: 1,
    padding: spacing(12),
    gap: spacing(10),
  },
  noteInput: {
    flex: 1,
    fontSize: fs(15),
    fontWeight: '500',
    maxHeight: spacing(100),
    padding: 0,
  },
  addBtn: {
    width: spacing(40),
    height: spacing(40),
    borderRadius: borderRadius(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    marginTop: spacing(16),
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing(60),
    gap: spacing(12),
  },
  emptyText: {
    fontSize: fs(16),
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  noteCard: {
    borderRadius: borderRadius(18),
    borderWidth: 1,
    padding: spacing(14),
    marginBottom: spacing(10),
  },
  noteContent: {
    fontSize: fs(15),
    fontWeight: '500',
    lineHeight: 22,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing(10),
    paddingTop: spacing(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  noteDate: {
    fontSize: fs(12),
    fontWeight: '500',
  },
  noteActions: {
    flexDirection: 'row',
    gap: spacing(16),
  },
  editMode: {
    gap: spacing(10),
  },
  editInput: {
    fontSize: fs(15),
    fontWeight: '500',
    padding: spacing(12),
    borderRadius: borderRadius(12),
    minHeight: spacing(80),
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing(20),
  },
  editBtn: {
    fontSize: fs(14),
    fontWeight: '600',
  },
});
