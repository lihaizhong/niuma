/**
 * Weather Service - 天气查询服务（使用高德 API）
 */

import { config } from 'dotenv';

// 加载 .env 文件
config();

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  forecast?: WeatherForecast[];
}

interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  description: string;
}

interface GeoLocation {
  city: string;
  adcode: string;
  lat: number;
  lon: number;
}

export class WeatherService {
  private apiKey: string;
  private location?: string;
  private cachedGeo?: GeoLocation;

  constructor(config?: { apiKey?: string; location?: string }) {
    this.apiKey = config?.apiKey ?? process.env.AMAP_API_KEY ?? '';
    this.location = config?.location;
  }

  /**
   * 通过 IP 获取地理位置（高德 API）
   */
  async getLocationByIP(): Promise<GeoLocation> {
    if (this.cachedGeo) {
      return this.cachedGeo;
    }

    if (!this.apiKey) {
      console.warn('未配置 AMAP_API_KEY，使用默认位置');
      return this.getDefaultLocation();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // 高德 IP 定位 API
      const response = await fetch(
        `https://restapi.amap.com/v3/ip?key=${this.apiKey}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as {
        status: string;
        city: string;
        adcode: string;
        rectangle: string;
      };

      if (data.status !== '1' || !data.city) {
        throw new Error('Invalid response');
      }

      // 解析 rectangle 获取中心点坐标
      let lat = 0, lon = 0;
      if (data.rectangle) {
        const coords = data.rectangle.split(';')[0].split(',');
        if (coords.length >= 2) {
          lon = parseFloat(coords[0]);
          lat = parseFloat(coords[1]);
        }
      }

      this.cachedGeo = {
        city: data.city,
        adcode: data.adcode,
        lat,
        lon,
      };

      return this.cachedGeo;
    } catch (error) {
      console.error('高德 IP 定位失败:', error);
      return this.getDefaultLocation();
    }
  }

  /**
   * 获取当前天气（高德天气 API）
   */
  async getCurrentWeather(): Promise<WeatherData> {
    let geo: GeoLocation;

    if (this.location) {
      geo = {
        city: this.location,
        adcode: '',
        lat: 0,
        lon: 0,
      };
    } else {
      geo = await this.getLocationByIP();
    }

    if (!this.apiKey) {
      return this.getMockWeather(geo.city);
    }

    try {
      // 使用城市名或 adcode 查询天气
      const cityParam = geo.adcode || geo.city;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.apiKey}&city=${encodeURIComponent(cityParam)}&extensions=base`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as {
        status: string;
        lives: Array<{
          city: string;
          weather: string;
          temperature: string;
          winddirection: string;
          windpower: string;
          humidity: string;
        }>;
      };

      if (data.status !== '1' || !data.lives?.length) {
        throw new Error('Invalid weather response');
      }

      const live = data.lives[0];

      return {
        location: live.city,
        temperature: parseInt(live.temperature, 10),
        description: live.weather,
        humidity: parseInt(live.humidity, 10),
        windSpeed: this.parseWindPower(live.windpower),
        feelsLike: parseInt(live.temperature, 10), // 高德不提供体感温度
      };
    } catch (error) {
      console.error('获取天气失败:', error);
      return this.getMockWeather(geo.city);
    }
  }

  /**
   * 解析风力等级为风速（近似值）
   */
  private parseWindPower(power: string): number {
    const windMap: Record<string, number> = {
      '1': 1, '2': 3, '3': 5, '4': 8, '5': 11,
      '6': 14, '7': 17, '8': 21, '9': 25, '10': 29,
      '11': 34, '12': 40,
    };
    return windMap[power] ?? 5;
  }

  /**
   * 生成天气问候语
   */
  async generateWeatherGreeting(): Promise<string> {
    const weather = await this.getCurrentWeather();
    const hour = new Date().getHours();
    let timeGreeting = '你好';

    if (hour < 6) {
      timeGreeting = '夜深了';
    } else if (hour < 12) {
      timeGreeting = '早上好';
    } else if (hour < 18) {
      timeGreeting = '下午好';
    } else {
      timeGreeting = '晚上好';
    }

    const tempDesc = this.getTemperatureDescription(weather.temperature);
    const suggestions = this.getWeatherSuggestions(weather);

    return `${timeGreeting}！今天${weather.location}的天气是${weather.description}，气温 ${weather.temperature}°C，${tempDesc}。${suggestions}`;
  }

  private getTemperatureDescription(temp: number): string {
    if (temp < 0) return '非常寒冷，注意保暖';
    if (temp < 10) return '比较冷，多穿点衣服';
    if (temp < 20) return '温度适中';
    if (temp < 28) return '天气舒适';
    if (temp < 35) return '有些热，注意防暑';
    return '高温天气，尽量避免户外活动';
  }

  private getWeatherSuggestions(weather: WeatherData): string {
    const suggestions: string[] = [];

    if (weather.humidity > 80) {
      suggestions.push('空气湿度较大');
    }

    if (weather.windSpeed > 10) {
      suggestions.push('风有点大');
    }

    if (weather.description.includes('雨')) {
      suggestions.push('记得带伞');
    }

    if (weather.description.includes('晴')) {
      suggestions.push('阳光不错，适合外出');
    }

    return suggestions.length > 0 ? suggestions.join('，') + '。' : '';
  }

  private getDefaultLocation(): GeoLocation {
    return {
      city: '北京',
      adcode: '110000',
      lat: 39.9042,
      lon: 116.4074,
    };
  }

  /**
   * 模拟天气数据（无 API Key 时使用）
   */
  private getMockWeather(location: string): WeatherData {
    const month = new Date().getMonth();
    const isWinter = month >= 10 || month <= 2;
    const isSummer = month >= 5 && month <= 8;

    let temp: number;
    let description: string;

    if (isWinter) {
      temp = Math.floor(Math.random() * 15) - 5;
      description = temp < 0 ? '多云' : '晴';
    } else if (isSummer) {
      temp = Math.floor(Math.random() * 10) + 25;
      description = temp > 30 ? '晴' : '多云';
    } else {
      temp = Math.floor(Math.random() * 10) + 15;
      description = '晴';
    }

    return {
      location,
      temperature: temp,
      description,
      humidity: Math.floor(Math.random() * 30) + 40,
      windSpeed: Math.floor(Math.random() * 10) + 2,
      feelsLike: temp,
    };
  }
}
