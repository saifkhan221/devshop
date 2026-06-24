<template>
  <div class="app-input">
    <label v-if="label" class="app-input__label">{{ label }}</label>
    <input
      v-bind="$attrs"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      class="app-input__field"
      :class="{ 'app-input__field--error': error }"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="app-input__error">{{ error }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  error: String,
  modelValue: [String, Number]
})
defineEmits(['update:modelValue'])
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app-input {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: $brand-300;
    letter-spacing: 0.02em;
  }

  &__field {
    width: 100%;
    background: $bg-elevated;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: 11px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: $brand-500;
      box-shadow: 0 0 0 3px var(--accent-subtle);
    }
    &::placeholder { color: rgba(167,139,250,0.4); }
    &--error { border-color: #f87171; }
  }

  &__error {
    font-size: 12px;
    color: #f87171;
  }
}
</style>
