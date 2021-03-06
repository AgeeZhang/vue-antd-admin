<template>
  <div class="el-image">
    <slot v-if="loading" name="placeholder">
      <div class="el-image__placeholder"></div>
    </slot>
    <slot v-else-if="error" name="error">
      <div class="el-image__error">{{ t('el.image.error') }}</div>
    </slot>
    <img
      v-else
      class="el-image__inner"
      v-bind="$attrs"
      v-on="$listeners"
      @click="clickHandler"
      :src="src"
      :style="imageStyle"
      :class="{ 'el-image__inner--center': alignCenter, 'el-image__preview': preview }"
    />
    <template v-if="preview">
      <image-viewer
        :z-index="zIndex"
        :initial-index="imageIndex"
        v-if="showViewer"
        :on-close="closeViewer"
        :url-list="previewSrcList"
      />
    </template>
  </div>
</template>
<script>
import ImageViewer from "./image-viewer";
import Locale from "./utils/locale";
import { on, off, getScrollContainer, isInContainer } from "./utils/dom";
import { isString, isHtmlElement } from "./utils/types";
import throttle from "throttle-debounce/throttle";

const isSupportObjectFit = () =>
  document.documentElement.style.objectFit !== undefined;

const ObjectFit = {
  NONE: "none",
  CONTAIN: "contain",
  COVER: "cover",
  FILL: "fill",
  SCALE_DOWN: "scale-down",
};

let prevOverflow = "";

export default {
  name: "GeeImage",
  mixins: [Locale],
  inheritAttrs: false,
  components: {
    ImageViewer,
  },
  props: {
    src: String,
    fit: String,
    lazy: Boolean,
    scrollContainer: {},
    previewSrcList: {
      type: Array,
      default: () => [],
    },
    zIndex: {
      type: Number,
      default: 2000,
    },
  },
  data() {
    return {
      loading: true,
      error: false,
      show: !this.lazy,
      imageWidth: 0,
      imageHeight: 0,
      showViewer: false,
    };
  },
  computed: {
    imageStyle() {
      const { fit } = this;
      if (!this.$isServer && fit) {
        return isSupportObjectFit()
          ? { "object-fit": fit }
          : this.getImageStyle(fit);
      }
      return {};
    },
    alignCenter() {
      return (
        !this.$isServer && !isSupportObjectFit() && this.fit !== ObjectFit.FILL
      );
    },
    preview() {
      const { previewSrcList } = this;
      return Array.isArray(previewSrcList) && previewSrcList.length > 0;
    },
    imageIndex() {
      let previewIndex = 0;
      const srcIndex = this.previewSrcList.indexOf(this.src);
      if (srcIndex >= 0) {
        previewIndex = srcIndex;
      }
      return previewIndex;
    },
  },

  watch: {
    src(val) {
      this.show && this.loadImage();
    },
    show(val) {
      val && this.loadImage();
    },
  },
  mounted() {
    if (this.lazy) {
      this.addLazyLoadListener();
    } else {
      this.loadImage();
    }
  },

  beforeDestroy() {
    this.lazy && this.removeLazyLoadListener();
  },
  methods: {
    loadImage() {
      if (this.$isServer) return;

      // 重置状态
      this.loading = true;
      this.error = false;

      const img = new Image();
      img.onload = (e) => this.handleLoad(e, img);
      img.onerror = this.handleError.bind(this);

      // 绑定属性
      Object.keys(this.$attrs).forEach((key) => {
        const value = this.$attrs[key];
        img.setAttribute(key, value);
      });
      img.src = this.src;
    },
    handleLoad(e, img) {
      this.imageWidth = img.width;
      this.imageHeight = img.height;
      this.loading = false;
      this.error = false;
    },
    handleError(e) {
      this.loading = false;
      this.error = true;
      this.$emit("error", e);
    },
    handleLazyLoad() {
      if (isInContainer(this.$el, this._scrollContainer)) {
        this.show = true;
        this.removeLazyLoadListener();
      }
    },
    addLazyLoadListener() {
      if (this.$isServer) return;

      const { scrollContainer } = this;
      let _scrollContainer = null;

      if (isHtmlElement(scrollContainer)) {
        _scrollContainer = scrollContainer;
      } else if (isString(scrollContainer)) {
        _scrollContainer = document.querySelector(scrollContainer);
      } else {
        _scrollContainer = getScrollContainer(this.$el);
      }

      if (_scrollContainer) {
        this._scrollContainer = _scrollContainer;
        this._lazyLoadHandler = throttle(200, this.handleLazyLoad);
        on(_scrollContainer, "scroll", this._lazyLoadHandler);
        this.handleLazyLoad();
      }
    },
    removeLazyLoadListener() {
      const { _scrollContainer, _lazyLoadHandler } = this;

      if (this.$isServer || !_scrollContainer || !_lazyLoadHandler) return;

      off(_scrollContainer, "scroll", _lazyLoadHandler);
      this._scrollContainer = null;
      this._lazyLoadHandler = null;
    },
    /**
     * 模拟对象适配行为以兼容IE11和其他不支持对象适配的浏览器
     */
    getImageStyle(fit) {
      const { imageWidth, imageHeight } = this;
      const {
        clientWidth: containerWidth,
        clientHeight: containerHeight,
      } = this.$el;

      if (!imageWidth || !imageHeight || !containerWidth || !containerHeight)
        return {};

      const vertical = imageWidth / imageHeight < 1;

      if (fit === ObjectFit.SCALE_DOWN) {
        const isSmaller =
          imageWidth < containerWidth && imageHeight < containerHeight;
        fit = isSmaller ? ObjectFit.NONE : ObjectFit.CONTAIN;
      }

      switch (fit) {
        case ObjectFit.NONE:
          return { width: "auto", height: "auto" };
        case ObjectFit.CONTAIN:
          return vertical ? { width: "auto" } : { height: "auto" };
        case ObjectFit.COVER:
          return vertical ? { height: "auto" } : { width: "auto" };
        default:
          return {};
      }
    },
    clickHandler() {
      // 预览为假时不显示查看器
      if (!this.preview) {
        return;
      }
      // 阻止滚动
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      this.showViewer = true;
    },
    closeViewer() {
      document.body.style.overflow = prevOverflow;
      this.showViewer = false;
    },
  },
};
</script>
<style lang="less" scoped>
.el-image {
  position: relative;
  display: inline-block;
  overflow: hidden;
}
.el-image__error,
.el-image__inner,
.el-image__placeholder {
  width: 100%;
  height: 100%;
}
.el-image__error {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: #c0c4cc;
  vertical-align: middle;
}

.el-image__placeholder {
  background: #f5f7fa;
}
.el-image__inner {
  vertical-align: top;
}
.el-image__preview {
  cursor: pointer;
}
</style>