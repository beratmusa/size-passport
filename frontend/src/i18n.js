import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  tr: {
    translation: {
      "app_title": "Evrensel Beden Pasaportu",
      "app_subtitle": "Kusursuz uyum için profilinizi tamamlayın.",
      "height": "Boy",
      "weight": "Kilo",
      "gender_female": "Kadın",
      "gender_male": "Erkek",
      "guide_title": "Nasıl Ölçü Alınır?",
      "measurements": {
        "shoulder": "Omuz",
        "chest": "Göğüs",
        "waist": "Bel",
        "arm": "Kol Boyu",
        "hip": "Basen",
        "inseam": "İç Bacak",
        "outseam": "Dış Bacak"
      },
      "fits": {
        "slim": "Dar Kesim",
        "regular": "Normal Kesim",
        "oversize": "Bol Kesim"
      },
      "save_button": "Profili Kaydet ve Tamamla",
      "saving": "Kaydediliyor..."
    }
  },
  en: {
    translation: {
      "app_title": "Universal Size Passport",
      "app_subtitle": "Complete your profile for the perfect fit.",
      "height": "Height",
      "weight": "Weight",
      "gender_female": "Female",
      "gender_male": "Male",
      "guide_title": "How to Measure?",
      "measurements": {
        "shoulder": "Shoulder",
        "chest": "Chest",
        "waist": "Waist",
        "arm": "Arm Length",
        "hip": "Hips",
        "inseam": "Inseam",
        "outseam": "Outseam"
      },
      "fits": {
        "slim": "Slim Fit",
        "regular": "Regular Fit",
        "oversize": "Oversize"
      },
      "save_button": "Save Profile & Complete",
      "saving": "Saving..."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "tr",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;