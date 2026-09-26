import React from 'react';
import { Platform, View } from 'react-native';
import RNQRCode from 'react-native-qrcode-svg';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  color = '#000000',
  backgroundColor = '#FFFFFF',
}) => {
  if (Platform.OS === 'web') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <QRCodeSVG
          value={value}
          size={size}
          fgColor={color}
          bgColor={backgroundColor}
          level="M"
        />
      </View>
    );
  }

  return (
    <RNQRCode
      value={value}
      size={size}
      color={color}
      backgroundColor={backgroundColor}
    />
  );
};
