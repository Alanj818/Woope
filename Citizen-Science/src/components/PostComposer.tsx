import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { PdfFile } from '../api/types';

type Props = {
  text: string;
  setText: (s: string) => void;
  images: string[];
  pdfs: PdfFile[] | any[];
  pickImage: () => Promise<void>;
  pickPdf: () => Promise<void>;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
  error?: string;
};

const PostComposer: React.FC<Props> = ({
  text,
  setText,
  images,
  pdfs,
  pickImage,
  pickPdf,
  onSubmit,
  onCancel,
  isEditing,
  error,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#C7DFF6"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={4}
      />

      <View style={styles.attachmentsRow}>
        {images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.previewImage} />
        ))}
        {pdfs.map((pdf: any, i: number) => (
          <Text key={i} style={styles.pdfText}>
            📄
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={styles.iconsRow}>
          <TouchableOpacity onPress={pickImage} style={styles.iconBtn}>
            <Text style={styles.iconText}>🖼️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickPdf} style={styles.iconBtn}>
            <Text style={styles.iconText}>📄</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubmit} style={styles.postButton}>
            <Text style={styles.postButtonText}>{isEditing ? 'UPDATE' : 'POST'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // keep outer card styling to the parent (HomeScreen). This container is the inner content only.
  container: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  input: {
  borderWidth: 0,
  borderBottomWidth: 1,
  borderBottomColor: '#E6F3FF',
  borderRadius: 8,
  padding: 12,
  minHeight: 56,
  textAlignVertical: 'top',
  backgroundColor: 'transparent',
  marginBottom: 8,
  fontSize: 18,
  lineHeight: 24,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconBtn: {
    marginRight: 12,
  },
  iconText: {
  fontSize: 22,
  },
  previewImage: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  attachmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  pdfText: {
    color: '#007AFF',
    marginBottom: 6,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  cancelButton: {
  backgroundColor: '#F0F0F0',
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 12,
  marginRight: 8,
  },
  cancelText: {
    color: '#333',
  },
  postButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PostComposer;
