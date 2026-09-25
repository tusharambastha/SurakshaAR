package com.surakshaar.app;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize Android Hardware TextToSpeech
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    ttsReady = true;
                    try {
                        tts.setLanguage(new Locale("hi", "IN"));
                        tts.setSpeechRate(0.95f);
                    } catch (Exception ignored) {}
                }
            }
        });

        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Expose native TTS to JavaScript
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void speak(String text, String lang) {
                    if (!ttsReady || tts == null || text == null || text.trim().isEmpty()) {
                        return;
                    }
                    runOnUiThread(() -> {
                        try {
                            if ("hi".equalsIgnoreCase(lang) || "sat".equalsIgnoreCase(lang) || "hinglish".equalsIgnoreCase(lang)) {
                                int r = tts.setLanguage(new Locale("hi", "IN"));
                                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                                    tts.setLanguage(Locale.ENGLISH);
                                }
                            } else {
                                tts.setLanguage(Locale.ENGLISH);
                            }
                            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "SurakshaSpeechId");
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
                }

                @JavascriptInterface
                public void stop() {
                    if (tts != null) {
                        runOnUiThread(() -> {
                            try {
                                tts.stop();
                            } catch (Exception ignored) {}
                        });
                    }
                }

                @JavascriptInterface
                public boolean isAvailable() {
                    return ttsReady;
                }
            }, "AndroidTTS");
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
