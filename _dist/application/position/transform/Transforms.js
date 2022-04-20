import { degToRad, mat4, vec3 }  from '@typhonjs-fvtt/svelte/math';

import * as constants            from '../constants.js';

import { TransformData }         from './TransformData.js';

const s_SCALE_VECTOR = [1, 1, 1];
const s_TRANSLATE_VECTOR = [0, 0, 0];
const s_MAT4_RESULT = mat4.create();
const s_MAT4_TEMP = mat4.create();
const s_VEC3_TEMP = vec3.create();

export class Transforms
{
   /**
    * Stores the number of transforms currently loaded.
    *
    * @type {number}
    */
   #count = 0;

   constructor()
   {
      this._data = {};
   }

   /**
    * @returns {boolean} Whether there are active transforms in local data.
    */
   get isActive() { return this.#count > 0; }

   /**
    * @returns {number|undefined} Any local rotateX data.
    */
   get rotateX() { return this._data.rotateX; }

   /**
    * @returns {number|undefined} Any local rotateY data.
    */
   get rotateY() { return this._data.rotateY; }

   /**
    * @returns {number|undefined} Any local rotateZ data.
    */
   get rotateZ() { return this._data.rotateZ; }

   /**
    * @returns {number|undefined} Any local rotateZ scale.
    */
   get scale() { return this._data.scale; }

   /**
    * @returns {number|undefined} Any local translateZ data.
    */
   get translateX() { return this._data.translateX; }

   /**
    * @returns {number|undefined} Any local translateZ data.
    */
   get translateY() { return this._data.translateY; }

   /**
    * @returns {number|undefined} Any local translateZ data.
    */
   get translateZ() { return this._data.translateZ; }

   /**
    * Sets the local rotateX data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set rotateX(value)
   {
      if (Number.isFinite(value))
      {
         if (this._data.rotateX === void 0) { this.#count++; }

         this._data.rotateX = value;
      }
      else
      {
         if (this._data.rotateX !== void 0) { this.#count--; }

         delete this._data.rotateX;
      }
   }

   /**
    * Sets the local rotateY data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set rotateY(value)
   {
      if (Number.isFinite(value))
      {
         if (this._data.rotateY === void 0) { this.#count++; }

         this._data.rotateY = value;
      }
      else
      {
         if (this._data.rotateY !== void 0) { this.#count--; }

         delete this._data.rotateY;
      }
   }

   /**
    * Sets the local rotateZ data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set rotateZ(value)
   {
      if (Number.isFinite(value))
      {
         if (this._data.rotateZ === void 0) { this.#count++; }

         this._data.rotateZ = value;
      }

      else
      {
         if (this._data.rotateZ !== void 0) { this.#count--; }

         delete this._data.rotateZ;
      }
   }

   /**
    * Sets the local scale data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set scale(value)
   {
      if (Number.isFinite(value))
      {
         if (this._data.scale === void 0) { this.#count++; }

         this._data.scale = value;
      }
      else
      {
         if (this._data.scale !== void 0) { this.#count--; }

         delete this._data.scale;
      }
   }

   /**
    * Sets the local translateX data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set translateX(value)
   {
      if (Number.isFinite(value))
      {
         if (this._data.translateX === void 0) { this.#count++; }

         this._data.translateX = value;
      }

      else
      {
         if (this._data.translateX !== void 0) { this.#count--; }

         delete this._data.translateX;
      }
   }

   /**
    * Sets the local translateY data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set translateY(value)
   {
      if (Number.isFinite(value))
      {
         if (this._data.translateY === void 0) { this.#count++; }

         this._data.translateY = value;
      }

      else
      {
         if (this._data.translateY !== void 0) { this.#count--; }

         delete this._data.translateY;
      }
   }

   /**
    * Sets the local translateZ data if the value is a finite number otherwise removes the local data.
    *
    * @param {number|null|undefined}   value - A value to set.
    */
   set translateZ(value)
   {
      if (Number.isFinite(value))
      {
         if (this._data.translateZ === void 0) { this.#count++; }

         this._data.translateZ = value;
      }

      else
      {
         if (this._data.translateZ !== void 0) { this.#count--; }

         delete this._data.translateZ;
      }
   }

   /**
    * Returns the matrix3d CSS transform for the given position / transform data.
    *
    * @param {object} [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns {string} The CSS matrix3d string.
    */
   getCSS(data = this._data)
   {
      return `matrix3d(${this.getMat4(data, s_MAT4_RESULT).join(',')})`;
   }

   /**
    * Returns the matrix3d CSS transform for the given position / transform data.
    *
    * @param {object} [data] - Optional position data otherwise use local stored transform data.
    *
    * @returns {string} The CSS matrix3d string.
    */
   getCSSOrtho(data = this._data)
   {
      return `matrix3d(${this.getMat4Ortho(data, s_MAT4_RESULT).join(',')})`;
   }

   /**
    * Collects all data including a bounding rect, transform matrix, and points array of the given {@link PositionData}
    * instance with the applied local transform data.
    *
    * @param {PositionData} position - The position data to process.
    *
    * @param {TransformData} [output] - Optional TransformData output instance.
    *
    * @param {object} [validationData] - Optional validation data for adjustment parameters.
    *
    * @returns {TransformData} The output TransformData instance.
    */
   getData(position, output = new TransformData(), validationData = {})
   {
      const valWidth = validationData.width ?? 0;
      const valHeight = validationData.height ?? 0;
      const valOffsetTop = validationData.offsetTop ?? validationData.marginTop ?? 0;
      const valOffsetLeft = validationData.offsetLeft ?? validationData.offsetLeft ?? 0;

      position.top += valOffsetTop;
      position.left += valOffsetLeft;

      const width = Number.isFinite(position.width) ? position.width : valWidth;
      const height = Number.isFinite(position.height) ? position.height : valHeight;

      const rect = output.corners;

      if (this.hasTransform(position))
      {
         rect[0][0] = rect[0][1] = rect[0][2] = 0;
         rect[1][0] = width;
         rect[1][1] = rect[1][2] = 0;
         rect[2][0] = width;
         rect[2][1] = height;
         rect[2][2] = 0;
         rect[3][0] = 0;
         rect[3][1] = height;
         rect[3][2] = 0;

         const matrix = this.getMat4(position, output.mat4);

         if (constants.transformOriginDefault === position.transformOrigin)
         {
            vec3.transformMat4(rect[0], rect[0], matrix);
            vec3.transformMat4(rect[1], rect[1], matrix);
            vec3.transformMat4(rect[2], rect[2], matrix);
            vec3.transformMat4(rect[3], rect[3], matrix);

            this.getOriginTranslation(position, output.originTranslations);
         }
         else
         {
            const translate = this.getOriginTranslation(position, output.originTranslations);

            vec3.transformMat4(rect[0], rect[0], translate[0]);
            vec3.transformMat4(rect[0], rect[0], matrix);
            vec3.transformMat4(rect[0], rect[0], translate[1]);

            vec3.transformMat4(rect[1], rect[1], translate[0]);
            vec3.transformMat4(rect[1], rect[1], matrix);
            vec3.transformMat4(rect[1], rect[1], translate[1]);

            vec3.transformMat4(rect[2], rect[2], translate[0]);
            vec3.transformMat4(rect[2], rect[2], matrix);
            vec3.transformMat4(rect[2], rect[2], translate[1]);

            vec3.transformMat4(rect[3], rect[3], translate[0]);
            vec3.transformMat4(rect[3], rect[3], matrix);
            vec3.transformMat4(rect[3], rect[3], translate[1]);
         }

         rect[0][0] = position.left + rect[0][0];
         rect[0][1] = position.top + rect[0][1];
         rect[1][0] = position.left + rect[1][0];
         rect[1][1] = position.top + rect[1][1];
         rect[2][0] = position.left + rect[2][0];
         rect[2][1] = position.top + rect[2][1];
         rect[3][0] = position.left + rect[3][0];
         rect[3][1] = position.top + rect[3][1];
      }
      else
      {
         rect[0][0] = position.left;
         rect[0][1] = position.top;
         rect[1][0] = position.left + width;
         rect[1][1] = position.top;
         rect[2][0] = position.left + width;
         rect[2][1] = position.top + height;
         rect[3][0] = position.left;
         rect[3][1] = position.top + height;

         mat4.identity(output.mat4);
      }

      let maxX = Number.MIN_SAFE_INTEGER;
      let maxY = Number.MIN_SAFE_INTEGER;
      let minX = Number.MAX_SAFE_INTEGER;
      let minY = Number.MAX_SAFE_INTEGER;

      for (let cntr = 4; --cntr >= 0;)
      {
         if (rect[cntr][0] > maxX) { maxX = rect[cntr][0]; }
         if (rect[cntr][0] < minX) { minX = rect[cntr][0]; }
         if (rect[cntr][1] > maxY) { maxY = rect[cntr][1]; }
         if (rect[cntr][1] < minY) { minY = rect[cntr][1]; }
      }

      const boundingRect = output.boundingRect;
      boundingRect.x = minX;
      boundingRect.y = minY;
      boundingRect.width = maxX - minX;
      boundingRect.height = maxY - minY;

      position.top -= valOffsetTop;
      position.left -= valOffsetLeft;

      return output;
   }

   /**
    * Creates a transform matrix based on local data applied in order it was added.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param {object}   [data] - PositionData instance or local transform data.
    *
    * @param {mat4}     [output] - The output mat4 instance.
    *
    * @returns {mat4} Transform matrix.
    */
   getMat4(data = this._data, output = mat4.create())
   {
      const matrix = mat4.identity(output);

      // Bitwise tracks applied transform keys from local transform data.
      let seenKeys = 0;

      // First apply ordered transforms from local transform data.
      for (const key in this._data)
      {
         switch (key)
         {
            case 'rotateX':
               seenKeys |= constants.transformKeysBitwise.rotateX;
               mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
               break;

            case 'rotateY':
               seenKeys |= constants.transformKeysBitwise.rotateY;
               mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
               break;

            case 'rotateZ':
               seenKeys |= constants.transformKeysBitwise.rotateZ;
               mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
               break;

            case 'scale':
               seenKeys |= constants.transformKeysBitwise.scale;
               s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
               mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
               break;

            case 'translateX':
               seenKeys |= constants.transformKeysBitwise.translateX;
               s_TRANSLATE_VECTOR[0] = this._data.translateX;
               s_TRANSLATE_VECTOR[1] = 0;
               s_TRANSLATE_VECTOR[2] = 0;
               mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
               break;

            case 'translateY':
               seenKeys |= constants.transformKeysBitwise.translateY;
               s_TRANSLATE_VECTOR[0] = 0;
               s_TRANSLATE_VECTOR[1] = this._data.translateY;
               s_TRANSLATE_VECTOR[2] = 0;
               mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
               break;

            case 'translateZ':
               seenKeys |= constants.transformKeysBitwise.translateZ;
               s_TRANSLATE_VECTOR[0] = 0;
               s_TRANSLATE_VECTOR[1] = 0;
               s_TRANSLATE_VECTOR[2] = this._data.translateZ;
               mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
               break;
         }
      }

      // Now apply any new keys not set in local transform data that have not been applied yet.
      if (data !== this._data)
      {
         for (const key of constants.transformKeys)
         {
            // Reject bad / no data or if the key has already been applied.
            if (!Number.isFinite(data[key]) || (seenKeys & constants.transformKeysBitwise[key]) > 0) { continue; }

            switch (key)
            {
               case 'rotateX':
                  mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
                  break;

               case 'rotateY':
                  mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
                  break;

               case 'rotateZ':
                  mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
                  break;

               case 'scale':
                  s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
                  mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
                  break;

               case 'translateX':
                  s_TRANSLATE_VECTOR[0] = data[key];
                  s_TRANSLATE_VECTOR[1] = 0;
                  s_TRANSLATE_VECTOR[2] = 0;
                  mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
                  break;

               case 'translateY':
                  s_TRANSLATE_VECTOR[0] = 0;
                  s_TRANSLATE_VECTOR[1] = data[key];
                  s_TRANSLATE_VECTOR[2] = 0;
                  mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
                  break;

               case 'translateZ':
                  s_TRANSLATE_VECTOR[0] = 0;
                  s_TRANSLATE_VECTOR[1] = 0;
                  s_TRANSLATE_VECTOR[2] = data[key];
                  mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
                  break;
            }
         }
      }

      return matrix;
   }

   /**
    * Creates a transform matrix based on local data applied in order it was added.
    *
    * If no data object is provided then the source is the local transform data. If another data object is supplied
    * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
    * construction of a transform matrix in advance of setting local data and is useful in collision detection.
    *
    * @param {object}   [data] - PositionData instance or local transform data.
    *
    * @param {mat4}     [output] - The output mat4 instance.
    *
    * @returns {mat4} Transform matrix.
    */
   getMat4Ortho(data = this._data, output = mat4.create())
   {
      const matrix = mat4.identity(output);

// console.log(`! Transforms - getMat4Ortho - data.left: ${data.left}; data.top: ${data.top}`)
      s_TRANSLATE_VECTOR[0] = data.left;
      s_TRANSLATE_VECTOR[1] = data.top;
      s_TRANSLATE_VECTOR[2] = 0;
      mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));

      // Bitwise tracks applied transform keys from local transform data.
      let seenKeys = 0;

      // First apply ordered transforms from local transform data.
      for (const key in this._data)
      {
         switch (key)
         {
            case 'rotateX':
               seenKeys |= constants.transformKeysBitwise.rotateX;
               mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
               break;

            case 'rotateY':
               seenKeys |= constants.transformKeysBitwise.rotateY;
               mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
               break;

            case 'rotateZ':
               seenKeys |= constants.transformKeysBitwise.rotateZ;
               mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
               break;

            case 'scale':
               seenKeys |= constants.transformKeysBitwise.scale;
               s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
               mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
               break;

            // case 'translateX':
            //    seenKeys |= constants.transformKeysBitwise.translateX;
            //    s_TRANSLATE_VECTOR[0] = this._data.translateX + data.left;
            //    s_TRANSLATE_VECTOR[1] = 0;
            //    s_TRANSLATE_VECTOR[2] = 0;
            //    mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
            //    break;
            //
            // case 'translateY':
            //    seenKeys |= constants.transformKeysBitwise.translateY;
            //    s_TRANSLATE_VECTOR[0] = 0;
            //    s_TRANSLATE_VECTOR[1] = this._data.translateY + data.top;
            //    s_TRANSLATE_VECTOR[2] = 0;
            //    mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
            //    break;

            case 'translateZ':
               seenKeys |= constants.transformKeysBitwise.translateZ;
               s_TRANSLATE_VECTOR[0] = 0;
               s_TRANSLATE_VECTOR[1] = 0;
               s_TRANSLATE_VECTOR[2] = this._data.translateZ;
               mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
               break;
         }
      }

      // Now apply any new keys not set in local transform data that have not been applied yet.
      if (data !== this._data)
      {
         for (const key of constants.transformKeys)
         {
            // Reject bad / no data or if the key has already been applied.
            if (!Number.isFinite(data[key]) || (seenKeys & constants.transformKeysBitwise[key]) > 0) { continue; }

            switch (key)
            {
               case 'rotateX':
                  mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
                  break;

               case 'rotateY':
                  mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
                  break;

               case 'rotateZ':
                  mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
                  break;

               case 'scale':
                  s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
                  mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
                  break;

               // case 'translateX':
               //    s_TRANSLATE_VECTOR[0] = data[key] + data.left;
               //    s_TRANSLATE_VECTOR[1] = 0;
               //    s_TRANSLATE_VECTOR[2] = 0;
               //    mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
               //    break;
               //
               // case 'translateY':
               //    s_TRANSLATE_VECTOR[0] = 0;
               //    s_TRANSLATE_VECTOR[1] = data[key] + data.top;
               //    s_TRANSLATE_VECTOR[2] = 0;
               //    mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
               //    break;

               case 'translateZ':
                  s_TRANSLATE_VECTOR[0] = 0;
                  s_TRANSLATE_VECTOR[1] = 0;
                  s_TRANSLATE_VECTOR[2] = data[key];
                  mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
                  break;
            }
         }
      }

      return matrix;
   }

   /**
    * Returns the translations necessary to translate a matrix operation based on the `transformOrigin` parameter of the
    * given position instance. The first entry / index 0 is the pre-translation and last entry / index 1 is the post-
    * translation.
    *
    * This method is used internally, but may be useful if you need the origin translation matrices to transform
    * bespoke points based on any `transformOrigin` set in {@link PositionData}.
    *
    * @param {PositionData}   position - A position instance.
    *
    * @param {mat4[]}         [output] - Output Mat4 array.
    *
    * @returns {mat4[]} Output Mat4 array.
    */
   getOriginTranslation(position, output = [mat4.create(), mat4.create()])
   {
      const vector = s_VEC3_TEMP;

      switch (position.transformOrigin)
      {
         case 'top left':
            vector[0] = vector[1] = 0;
            mat4.fromTranslation(output[0], vector);
            mat4.fromTranslation(output[1], vector);
            break;

         case 'top center':
            vector[0] = -position.width / 2;
            vector[1] = 0;
            mat4.fromTranslation(output[0], vector);
            vector[0] = position.width / 2;
            mat4.fromTranslation(output[1], vector);
            break;

         case 'top right':
            vector[0] = -position.width;
            vector[1] = 0;
            mat4.fromTranslation(output[0], vector);
            vector[0] = position.width;
            mat4.fromTranslation(output[1], vector);
            break;

         case 'center left':
            vector[0] = 0;
            vector[1] = -position.height / 2;
            mat4.fromTranslation(output[0], vector);
            vector[1] = position.height / 2;
            mat4.fromTranslation(output[1], vector);
            break;

         case null: // By default null / no transform is center.
         case 'center':
            vector[0] = -position.width / 2;
            vector[1] = -position.height / 2;
            mat4.fromTranslation(output[0], vector);
            vector[0] = position.width / 2;
            vector[1] = position.height / 2;
            mat4.fromTranslation(output[1], vector);
            break;

         case 'center right':
            vector[0] = -position.width;
            vector[1] = -position.height / 2;
            mat4.fromTranslation(output[0], vector);
            vector[0] = position.width;
            vector[1] = position.height / 2;
            mat4.fromTranslation(output[1], vector);
            break;

         case 'bottom left':
            vector[0] = 0;
            vector[1] = -position.height;
            mat4.fromTranslation(output[0], vector);
            vector[1] = position.height;
            mat4.fromTranslation(output[1], vector);
            break;

         case 'bottom center':
            vector[0] = -position.width / 2;
            vector[1] = -position.height;
            mat4.fromTranslation(output[0], vector);
            vector[0] = position.width / 2;
            vector[1] = position.height;
            mat4.fromTranslation(output[1], vector);
            break;

         case 'bottom right':
            vector[0] = -position.width;
            vector[1] = -position.height;
            mat4.fromTranslation(output[0], vector);
            vector[0] = position.width;
            vector[1] = position.height;
            mat4.fromTranslation(output[1], vector);
            break;

       // No valid transform origin parameter; set identity.
         default:
            mat4.identity(output[0]);
            mat4.identity(output[1]);
            break;
      }

      return output;
   }

   /**
    * Tests an object if it contains transform keys and the values are finite numbers.
    *
    * @param {object} data - An object to test for transform data.
    *
    * @returns {boolean} Whether the given PositionData has transforms.
    */
   hasTransform(data)
   {
      for (const key of constants.transformKeys)
      {
         if (Number.isFinite(data[key])) { return true; }
      }

      return false;
   }

   /**
    * Resets internal data from the given object containing valid transform keys.
    *
    * @param {object}   data - An object with transform data.
    */
   reset(data)
   {
      for (const key in data)
      {
         if (constants.transformKeys.includes(key) && Number.isFinite(data[key]))
         {
            this._data[key] = data[key];
         }
         else
         {
            delete this._data[key];
         }
      }

      this.#count = Object.keys(this._data).length;
   }
}