import { Audio } from 'expo-av';

export type SoundType = 'completion' | 'halfway';

class AudioServiceClass {
  private sounds: Record<SoundType, Audio.Sound | null> = {
    completion: null,
    halfway: null,
  };
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound: completionSound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/timer-complete.mp3')
    );
    const { sound: halfwaySound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/timer-halfway.mp3')
    );

    this.sounds.completion = completionSound;
    this.sounds.halfway = halfwaySound;
    this.initialized = true;
  }

  async playSound(type: SoundType, options?: { loop?: boolean }) {
    const sound = this.sounds[type];
    if (!sound) return;

    await sound.setPositionAsync(0);
    await sound.setIsLoopingAsync(options?.loop ?? false);
    await sound.playAsync();
  }

  async stopSound(type: SoundType) {
    const sound = this.sounds[type];
    if (sound) await sound.stopAsync();
  }

  async stopAllSounds() {
    await this.stopSound('completion');
    await this.stopSound('halfway');
  }
}

export const AudioService = new AudioServiceClass();
