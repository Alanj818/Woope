import React, { useContext, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";
import { LinearGradient } from "expo-linear-gradient";
import TopNav from "../components/TopNav";
import { AuthContext } from "../util/AuthContext";
import { jwtDecode } from "jwt-decode";
import { AccessToken } from "../util/token";
import { createReport } from "../api/report";
import { logActivity } from "../api/activity";

const MAX_DESCRIPTION = 500;

export const ReportScreen: React.FC<any> = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const decoded = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const userId = decoded ? decoded.user_id : NaN;

  const [title, setTitle] = useState("");
  const issueTypes = ["Bug", "App Crash", "UI Issue", "Feature Request", "Other"];
  const pageSections = ["Home", "Dashboard", "Calendar", "Search", "Resources", "Profile", "Map"];
  const severities = ["Low", "Medium", "High", "Critical"];

  const [issueType, setIssueType] = useState<string | null>(null);
  const [pageSection, setPageSection] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState("");
  const [description, setDescription] = useState("");

  const isFormValid =
    !!issueType && title.trim().length > 0 && !!pageSection && !!severity && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please fill out all required fields before submitting.");
      return;
    }
    try {
      const payload = {
        description: description.trim(),
        page_section: pageSection,
        severity,
        device: deviceInfo,
        user_id: userId,
      } as any;

      // createReport expects 3 args: type, title, payload
      await createReport(issueType!, title.trim(), payload);

      Alert.alert("Success", "Report created successfully!");
      logActivity(userId, "Submitted Report");

      // reset
      setIssueType(null);
      setPageSection(null);
      setSeverity(null);
      setDeviceInfo("");
      setTitle("");
      setDescription("");
      navigation.goBack();
    } catch (err) {
      console.error("Report submit error:", err);
      Alert.alert("Error", "Failed to create the report. Please try again.");
    }
  };

  return (
    <View style={styles.screen}>
      <TopNav title="Report an Issue" showBack onBack={() => navigation.goBack()} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sub}>Help us improve the app</Text>

          <Text style={styles.label}>Issue Type *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            nestedScrollEnabled={true}
          >
            {issueTypes.map((it) => (
              <TouchableOpacity
                key={it}
                style={[styles.chip, issueType === it && styles.chipSelected]}
                onPress={() => setIssueType(issueType === it ? null : it)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, issueType === it && styles.chipTextSelected]}>{it}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief title for the issue"
            placeholderTextColor="#9b9b9b"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Page/Section *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            nestedScrollEnabled={true}
          >
            {pageSections.map((ps) => (
              <TouchableOpacity
                key={ps}
                style={[styles.chip, pageSection === ps && styles.chipSelected]}
                onPress={() => setPageSection(pageSection === ps ? null : ps)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, pageSection === ps && styles.chipTextSelected]}>{ps}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Severity *</Text>
          <View style={styles.severityGrid}>
            {severities.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.severityBtn, severity === s && styles.severityBtnSelected]}
                onPress={() => setSeverity(severity === s ? null : s)}
                activeOpacity={0.85}
              >
                <Text style={[styles.severityText, severity === s && styles.severityTextSelected]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Device/Browser</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., iPhone 15, Chrome on Mac"
            placeholderTextColor="#9b9b9b"
            value={deviceInfo}
            onChangeText={setDeviceInfo}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please describe the issue in detail. Include steps to reproduce."
            placeholderTextColor="#9b9b9b"
            value={description}
            onChangeText={(txt) => {
              if (txt.length <= MAX_DESCRIPTION) setDescription(txt);
            }}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/{MAX_DESCRIPTION} characters</Text>

          <View style={styles.thankBox}>
            <Text style={styles.thankTitle}>Thank you!</Text>
            <Text style={styles.thankText}>
              Your feedback helps us make the app better. We review all reports and will work on fixes as soon as
              possible.
            </Text>
          </View>

          <View style={styles.saveWrap}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleSubmit} disabled={!isFormValid}>
              {isFormValid ? (
                <LinearGradient
                  colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveText}>Submit Report</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.saveBtn, styles.saveBtnDisabled]}>
                  <Text style={[styles.saveText, styles.saveTextDisabled]}>Submit Report</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  content: {
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(2.2),
    paddingBottom: responsiveHeight(4),
  },
  sub: {
    color: "#6b7280",
    marginBottom: responsiveHeight(2),
    fontSize: responsiveFontSize(1.8),
  },
  label: {
    color: "#4a4a4a",
    fontSize: responsiveFontSize(1.7),
    marginBottom: responsiveHeight(0.8),
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    marginBottom: responsiveHeight(1.6),
    alignItems: "center",
  },
  chip: {
    backgroundColor: "#f1f5f9",
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(3.6),
    borderRadius: responsiveHeight(2.2),
    marginRight: responsiveWidth(2),
    marginBottom: responsiveHeight(1.2),
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: "#eaf5ff",
    borderColor: "#9ed0ff",
  },
  chipText: {
    color: "#374151",
    fontSize: responsiveFontSize(1.7),
  },
  chipTextSelected: {
    color: "#0366d6",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: responsiveHeight(1.6),
    borderWidth: 1,
    borderColor: "#e5e5ea",
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.6),
    marginBottom: responsiveHeight(1.6),
    fontSize: responsiveFontSize(1.8),
  },
  textArea: {
    minHeight: responsiveHeight(14),
  },
  severityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(1.6),
  },
  severityBtn: {
    width: "48%",
    paddingVertical: responsiveHeight(1.5),
    borderRadius: responsiveHeight(1.4),
    backgroundColor: "#f3f4f6",
    marginBottom: responsiveHeight(1.2),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  severityBtnSelected: {
    backgroundColor: "#e8f2ff",
    borderColor: "#9ed0ff",
  },
  severityText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: responsiveFontSize(1.7),
  },
  severityTextSelected: {
    color: "#0366d6",
  },
  charCount: {
    alignSelf: "flex-start",
    color: "#6b7280",
    fontSize: responsiveFontSize(1.4),
    marginBottom: responsiveHeight(1.4),
  },
  thankBox: {
    backgroundColor: "#e9f6ff",
    borderRadius: responsiveHeight(1.4),
    padding: responsiveWidth(3.6),
    borderWidth: 1,
    borderColor: "#cfeeff",
    marginBottom: responsiveHeight(2),
  },
  thankTitle: {
    fontWeight: "700",
    color: "#0b66a6",
    marginBottom: responsiveHeight(0.6),
    fontSize: responsiveFontSize(1.8),
  },
  thankText: {
    color: "#1f2937",
    fontSize: responsiveFontSize(1.6),
  },
  saveWrap: { marginTop: responsiveHeight(1), paddingBottom: responsiveHeight(4) },
  saveBtn: {
    height: responsiveHeight(6.6),
    borderRadius: responsiveHeight(2.2),
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#f1f3f6",
  },
  saveText: { color: "#fff", fontSize: responsiveFontSize(2), fontWeight: "600" },
  saveTextDisabled: { color: "#9aa8b8" },
});

export default ReportScreen;
