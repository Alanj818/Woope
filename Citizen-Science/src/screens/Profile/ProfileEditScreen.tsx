import React, { useContext, useEffect, useState } from "react";
import { Text, Image, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";
import { getProfile, updateName, updatePfp } from "../../api/community";
import { jwtDecode } from "jwt-decode";
import { AccessToken } from "../../util/token";
import { AuthContext } from "../../util/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { logActivity } from "../../api/activity";
import { LinearGradient } from "expo-linear-gradient";
import TopNav from "../../components/TopNav";

interface ProfileEditProps {
  navigation: any;
}

const DEFAULT_PFP = "https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png";

const ProfileEditScreen: React.FC<ProfileEditProps> = ({ navigation }) => {
  const { userToken, setUserToken } = useContext(AuthContext);
  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const user_id = decodedToken ? decodedToken.user_id : NaN;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [localPfpUri, setLocalPfpUri] = useState<string | null>(null);
  const [remotePfpUrl, setRemotePfpUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const extractEmail = (data: any): string =>
    data?.user?.email ?? data?.email ?? data?.user?.profile?.email ?? data?.user?.user?.email ?? "";

  const extractFirstName = (user: any): string => user?.first_name ?? user?.firstName ?? "";
  const extractLastName = (user: any): string => user?.last_name ?? user?.lastName ?? "";
  const extractImageUrl = (user: any): string | null =>
    user?.image_url ?? user?.imageUrl ?? user?.avatarUrl ?? null;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user_id || isNaN(user_id)) return;
        const data = await getProfile(user_id);
        const user = data?.user ?? {};
        setFirstName(extractFirstName(user));
        setLastName(extractLastName(user));
        setEmail(user?.email || '');
        setBio(user?.bio ?? "");
        setPhone(user?.phone ?? "");
        const imageUrl = extractImageUrl(user);
        if (imageUrl) {
          const base = process.env.EXPO_PUBLIC_API_URL ?? "";
          const full = String(imageUrl).startsWith("http") ? String(imageUrl) : `${base}${imageUrl}`;
          setRemotePfpUrl(full);
        } else {
          setRemotePfpUrl(null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    fetchProfile();
  }, [user_id]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setLocalPfpUri(uri);
        setRemotePfpUrl(uri);
        if (user_id) logActivity(user_id, "Selected a new profile picture");
      }
    } catch (err) {
      console.error("Image pick error:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user_id && !isNaN(user_id)) {
        await updateName(user_id, firstName.trim(), lastName.trim(), userToken, setUserToken);
        logActivity(user_id, "Updated username");
        if (localPfpUri) {
          await updatePfp(String(user_id), localPfpUri);
          logActivity(user_id, "Updated profile picture");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
      navigation.goBack();
    }
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <View style={styles.screen}>
      <TopNav title="Edit Profile" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.9}>
            <LinearGradient
              colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarOuter}
            >
              <View style={styles.avatarInner}>
                {remotePfpUrl ? (
                  <Image source={{ uri: remotePfpUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Image source={{ uri: DEFAULT_PFP }} style={styles.avatarImage} resizeMode="cover" />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.tapText}>Tap to change profile photo</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
              />
            </View>
            <View style={styles.nameField}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={email} editable={false} placeholder="Email" />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            multiline
            textAlignVertical="top"
            placeholder="Tell us about yourself..."
          />

          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="(555) 123-4567"
          />
        </View>

        <View style={styles.saveWrap}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleSave}>
            <LinearGradient
              colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  content: {
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(3),
    paddingBottom: responsiveHeight(4),
  },
  avatarWrap: { alignItems: "center", marginBottom: responsiveHeight(2.6) },
  avatarOuter: {
    width: responsiveHeight(17),
    height: responsiveHeight(17),
    borderRadius: responsiveHeight(8.5),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarInner: {
    width: responsiveHeight(15),
    height: responsiveHeight(15),
    borderRadius: responsiveHeight(7.5),
    backgroundColor: "#29b6f6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  tapText: {
    marginTop: responsiveHeight(1.2),
    color: "#8e8e93",
    fontSize: responsiveFontSize(1.6),
  },
  form: { marginTop: responsiveHeight(0.5) },
  nameRow: {
    flexDirection: 'row',
    gap: responsiveWidth(3),
    marginBottom: responsiveHeight(0.5),
  },
  nameField: {
    flex: 1,
  },
  label: {
    color: "#4a4a4a",
    fontSize: responsiveFontSize(1.7),
    marginBottom: responsiveHeight(0.8),
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: responsiveHeight(1.8),
    borderWidth: 1,
    borderColor: "#e5e5ea",
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.6),
    marginBottom: responsiveHeight(1.8),
    fontSize: responsiveFontSize(1.8),
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#8e8e93",
  },
  bioInput: { minHeight: responsiveHeight(14) },
  saveWrap: { marginTop: responsiveHeight(1), paddingBottom: responsiveHeight(4) },
  saveBtn: {
    height: responsiveHeight(6.6),
    borderRadius: responsiveHeight(2.2),
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: responsiveFontSize(2), fontWeight: "600" },
});

export default ProfileEditScreen;