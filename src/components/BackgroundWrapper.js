import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const BackgroundWrapper = ({ children }) => {
    return (
        <ImageBackground
            source={require('../../assets/background.png')}
            style={styles.background}
            resizeMode="cover"
            
        >
            {/* Overlay to adjust opacity */}
            <View style={styles.overlay}>
                {children}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
       
        
    },
});

export default BackgroundWrapper;