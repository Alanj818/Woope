/*
    This screen displays the information and files of the selected resource 
*/
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import ResourceCard from '../../components/ResourceCard';
import TopNav from '../../components/TopNav';

const STRINGS = {
    title: 'Resource',
};

export const ResourceProfile = ({ route, navigation }: { route: any; navigation: any }) => {
    return (
        <View style={styles.container}>
            <TopNav title={STRINGS.title} showBack={true} onBack={() => navigation.goBack()} />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <ResourceCard
                        resource_id={route.params.resource_id}
                        org_id={route.params.org_id}
                        expanded={true}
                    />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7fa',
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 36,
    },
});

export default ResourceProfile;