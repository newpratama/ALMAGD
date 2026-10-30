import type { Locale } from './i18n';

export const WHATSAPP_NUMBERS = {
  new_pratama: '6285117588248',
  villa_njd: '6281333035141',
  njd_cafe: '6281116618075',
} as const;

export type VenueKey = keyof typeof WHATSAPP_NUMBERS;

const TEMPLATES = {
  new_pratama: {
    id: 'Halo tim New Pratama Villa. Saya melihat situs ALMAGD dan ingin menanyakan ketersediaan menginap. Tanggal masuk: [tanggal]. Tanggal keluar: [tanggal]. Jumlah tamu: [dewasa/anak]. Mohon informasi pilihan menginap yang sesuai. Terima kasih.',
    en: 'Hello New Pratama Villa team. I found you on the ALMAGD website and would like to ask about a stay. Check-in: [date]. Check-out: [date]. Guests: [adults/children]. Please let me know which stay options may suit us. Thank you.',
    ar: 'مرحباً فريق New Pratama Villa. اطّلعت على موقع المجد وأرغب في الاستفسار عن إقامة. تاريخ الوصول: [التاريخ]. تاريخ المغادرة: [التاريخ]. عدد الضيوف: [بالغون/أطفال]. أرجو تزويدي بخيارات الإقامة المناسبة. شكراً لكم.',
  },
  villa_njd: {
    id: 'Halo tim Villa NJD. Saya melihat situs ALMAGD dan ingin menanyakan ketersediaan kamar. Tanggal masuk: [tanggal]. Tanggal keluar: [tanggal]. Jumlah tamu: [dewasa/anak]. Mohon informasi pilihan kamar dan detail menginap. Terima kasih.',
    en: 'Hello Villa NJD team. I found you on the ALMAGD website and would like to ask about room availability. Check-in: [date]. Check-out: [date]. Guests: [adults/children]. Please share room options and stay details. Thank you.',
    ar: 'مرحباً فريق Villa NJD. اطّلعت على موقع المجد وأرغب في الاستفسار عن توافر الغرف. تاريخ الوصول: [التاريخ]. تاريخ المغادرة: [التاريخ]. عدد الضيوف: [بالغون/أطفال]. أرجو تزويدي بخيارات الغرف وتفاصيل الإقامة. شكراً لكم.',
  },
  njd_cafe: {
    id: 'Halo tim NJD Cafe. Saya melihat menu di situs ALMAGD. Saya ingin menanyakan informasi menu dan kunjungan. Rencana kunjungan: [tanggal/waktu]. Jumlah orang: [jumlah]. Mohon informasi lebih lanjut. Terima kasih.',
    en: 'Hello NJD Cafe team. I saw your menu on the ALMAGD website. I would like to ask about the menu and visiting. Planned visit: [date/time]. People: [number]. Please share more information. Thank you.',
    ar: 'مرحباً فريق NJD Cafe. اطّلعت على قائمتكم في موقع المجد وأرغب في الاستفسار عن القائمة والزيارة. موعد الزيارة المقترح: [التاريخ/الوقت]. عدد الأشخاص: [العدد]. أرجو تزويدي بمزيد من المعلومات. شكراً لكم.',
  },
};

const CONTEXT_ADDITIONS = {
  room: {
    id: ' Saya tertarik dengan tipe: {room_name}.',
    en: ' I am interested in: {room_name}.',
    ar: ' أهتم بخيار الإقامة: {room_name}.',
  },
  item: {
    id: ' Saya ingin menanyakan item: {item_name}, termasuk harga dan ketersediaannya.',
    en: ' I would like to ask about {item_name}, including its price and availability.',
    ar: ' أود الاستفسار عن الصنف {item_name} وسعره وتوافره.',
  },
  access: {
    id: ' Mohon informasi akses menuju {venue}.',
    en: ' Please share access information for {venue}.',
    ar: ' أرجو تزويدي بمعلومات الوصول إلى {venue}.',
  },
};

export interface WhatsAppLinkOptions {
  venue: VenueKey;
  locale: Locale;
  context?: 'room' | 'item' | 'access';
  contextParam?: string; // room name, item name, or venue display name
}

export function buildWhatsAppLink(options: WhatsAppLinkOptions): string {
  const number = WHATSAPP_NUMBERS[options.venue];
  let text = TEMPLATES[options.venue][options.locale] || TEMPLATES[options.venue].id;

  if (options.context && options.contextParam) {
    let addition = CONTEXT_ADDITIONS[options.context][options.locale] || CONTEXT_ADDITIONS[options.context].id;
    if (options.context === 'room') {
      addition = addition.replace('{room_name}', options.contextParam);
    } else if (options.context === 'item') {
      addition = addition.replace('{item_name}', options.contextParam);
    } else if (options.context === 'access') {
      addition = addition.replace('{venue}', options.contextParam);
    }
    text += addition;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
